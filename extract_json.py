# -*- coding: utf-8 -*-

import base64
import csv
import json
import os
import shutil
import logging
import gzip
import datetime
import pandas as pd
from Bio import SeqIO
from ete3 import Tree
logger = logging.getLogger(__name__)


def copy_file_to_web(orginal_file, web_dir):
    try:
        web_file = os.path.join(web_dir, os.path.basename(orginal_file))
        shutil.copyfile(orginal_file, web_file)
        return web_file
    except:
        logger.error('copy file '+orginal_file+' error')
        return None  # This wouldnt be executed


def export_json(work_dir, webapp_data_dir, collection_id, collection_name=''):

    update_collection_history(webapp_data_dir, collection_id, collection_name, "Not Ready")
    # look for dump file:
    dump_file = os.path.join(work_dir, 'collections', collection_id, collection_id + '_dump.json')
    if not os.path.isfile(dump_file):
        raise Exception("Dump file {} not found!".format(dump_file))

    exp_dir_current = os.path.join(webapp_data_dir, collection_id)
    if not os.path.exists(exp_dir_current):
        os.makedirs(exp_dir_current)
    exp_dir_downloadfile = os.path.join(exp_dir_current, 'files')
    if not os.path.exists(exp_dir_downloadfile):
        os.makedirs(exp_dir_downloadfile)
   # if (not os.path.isabs(exp_dir_downloadfile)):
    #    exp_dir_downloadfile =os.path.join(os.path.dirname(__file__),exp_dir_downloadfile)
    report = json.load(open(dump_file))

    # export single samples
    web_samples = []
    for sample in report['samples']:
        sample_files = []
        sample_files.append({'name': 'FASTA', 'file': copy_file_to_web(sample['assembly'], exp_dir_downloadfile)})
        sample_files.append({'name': 'GFF', 'file': copy_file_to_web(sample['annotation_gff'], exp_dir_downloadfile)})
        sample_files.append({'name': 'GBK', 'file': copy_file_to_web(sample['annotation_gbk'], exp_dir_downloadfile)})

        sample_results = []
        sample_results.append({'group': 'CONTIG', 'data': export_assembly(sample['assembly'])})
        mlst_info=extract_mlst(sample['mlst'])
        sample_results.append({'group': 'MLST', 'data': mlst_info})
        sample_results.append({'group': 'VIR', 'data': find_virulome(sample['virulome'])})
        sample_results.append({'group': 'AMR', 'data': find_amr(sample['resistome'])})
        sample_results.append({'group': 'PLASMID', 'data': find_plasmid(sample['plasmid'])})
        sample_results.append({'group': 'ANNOTATION', 'data': export_known_genes(sample['annotation_gff'])})

        sample['result'] = sample_results

        # TODO: Quang to review if this function stores more than we need
        save_sample_result(sample, exp_dir_current)
        #add ST to metadata
        sample['metadata']['MLST']=mlst_info['st']
        web_samples.append({
            'id': sample['id'],
            'name': sample['name'],
            'type': sample['input_type'],
            'files': sample['files'],
            'genus': sample['genus'],
            'species': sample['species'],
            'strain': sample['strain'],
            'metadata': sample['metadata'],
            'download': sample_files
        })

    set_result = []
    if not os.path.exists(exp_dir_current + "/set"):
        os.makedirs(exp_dir_current + "/set")
    set_result.append({'group': 'phylo_heatmap', 'data': export_amr_heatmap(report, exp_dir_current)})
    set_result.append({'group': 'pan_sum',
                       'data': export_pangenome_summary(report['roary'] + '/summary_statistics.txt',
                                                        exp_dir_current)})
    set_result.append({'group': 'pan_cluster',
                       'data': export_pangenome_cluster(report['roary'] + '/gene_presence_absence.csv.gz',
                                                        exp_dir_current)})
    set_result.append(
        {'group': 'phylogeny_tree', 'data': export_phylogeny_tree(report['phylogeny'] + '/core_gene_alignment.treefile')})
    set_result.append({'group': 'gene_alignments', 'data': export_msa(report, exp_dir_current)})
    collection_report = {"samples": web_samples, "results": set_result}
    json.dump(collection_report, open(exp_dir_current + '/set.json', 'w'))
    update_collection_history(webapp_data_dir, collection_id, collection_name, "Ready")


def export_assembly(contigs_file_contents):
    # contigs_file: contigs.fasta
    contigs_stat = {}
    contigs_stat['contigs'] = []
    genome_length = 0
    pattern = 'GCgc'
    num_gc = 0

    seq_dict = {}
    skew_list = []
    content_list = []
    with gzip.open(contigs_file_contents, 'rt') as fn:
        for seq in SeqIO.parse(fn, "fasta"):
            current_contig = ''
            nodename = seq.id
            length = len(seq.seq)
            contigs_stat['contigs'].append({'name': nodename, 'length': length})
            current_contig = nodename
            seq_dict[current_contig] = str(seq.seq)
            genome_length = genome_length + length
            for i in range(len(seq.seq)):
                if seq.seq[i] in pattern:
                    num_gc = num_gc + 1

                # running window 1000 step 10 for skew
    for c in seq_dict.keys():

        list_GCskew = []
        list_GCcontent = []
        window = 1000
        slide = 100
        if len(seq_dict[c]) < 1000:
            window = len(seq_dict[c])
        for i in range(0, len(seq_dict[c]) - window + 1, slide):
            Seq = seq_dict[c][i:i + window].upper()
            G = Seq.count('G')
            C = Seq.count('C')
            A = Seq.count('A')
            T = Seq.count('T')
            GC = 0
            if G != 0 or C != 0:
                GC = (C - G) / (G + C + 0.0)

            list_GCskew.append(round(GC, 3))
            list_GCcontent.append(round((G + C) / (G + C + A + T), 3))
        skew_list.append({'contig': c, 'GC': list_GCskew})
        content_list.append({'contig': c, 'GC': list_GCcontent})

    # call n50
    s = 0
    n50 = 0
    for i in range(len(contigs_stat['contigs'])):
        s = s + contigs_stat['contigs'][i]['length']
        if s >= genome_length / 2:
            n50 = contigs_stat['contigs'][i]['length']
            break
    contigs_stat['n_contig'] = len(contigs_stat['contigs'])
    contigs_stat['genome_length'] = genome_length
    contigs_stat['N50'] = n50
    contigs_stat['min_length'] = contigs_stat['contigs'][len(contigs_stat['contigs']) - 1]['length']
    contigs_stat['max_length'] = contigs_stat['contigs'][0]['length']
    contigs_stat['GC'] = (num_gc / genome_length) * 100
    contigs_stat['skew'] = skew_list
    contigs_stat['content'] = {'window': 1000, 'step': 100, 'array': content_list}
    return contigs_stat


def extract_mlst(mlst_file):
    """
    Extract mlst data::: from Quang
    """
    ret = {}
    with open(mlst_file) as tsvfile:
        reader = csv.reader(tsvfile, delimiter='\t')
        for row in reader:
            ret['st'] = row[1] + ' ST[' + row[2] + ']'
            ret['hits'] = []

            for i in range(3, len(row)):
                ret['hits'].append({'locus': row[i].split('(')[0], 'allele': row[i].split('(')[1].replace(')', '')})
    return ret


def find_virulome(virulome_file):
    set_vir = set()
    ret = {'hits': []}
    with open(virulome_file) as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab')
        for row in reader:
            vir = {}
            if '~~~' in row['GENE']:
                gene = row['GENE'].split('~~~')[1]

            else:
                gene = row['GENE'].strip()
            set_vir.add(gene)
            vir['sequence'] = row['SEQUENCE']
            vir['start'] = row['START']
            vir['end'] = row['END']
            vir['strain'] = row['STRAND']
            vir['gene'] = gene
            vir['coverage'] = row['%COVERAGE'] + '%'
            vir['identity'] = row['%IDENTITY'] + '%'
            vir['db'] = row['DATABASE']
            vir['accession'] = row['ACCESSION']
            vir['product'] = row['PRODUCT']
            ret['hits'].append(vir)

    s_gene = ''

    for v in set_vir:
        s_gene = s_gene + v + ', '
    ret['genes'] = s_gene[:-2]

    return ret


def find_amr(amr_file):
    print(amr_file)
    set_amr = set()
    ret = {'hits': []}
    
    with open(amr_file) as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab')
        #print(len(reader))
        for row in reader:
            amr = {}
            set_amr.add(row['RESISTANCE'].strip())
            amr['sequence'] = row['SEQUENCE']
            amr['start'] = row['START']
            amr['end'] = row['END']
            amr['strain'] = row['STRAND']
            amr['gene'] = row['GENE'].strip()
            amr['coverage'] = row['%COVERAGE'] + '%'
            amr['identity'] = row['%IDENTITY'] + '%'
            amr['db'] = row['DATABASE']
            amr['accession'] = row['ACCESSION']
            amr['product'] = row['PRODUCT']
            amr['resistance'] = row['RESISTANCE']
            ret['hits'].append(amr)
            
    str_gene = ''

    for v in set_amr:
        str_gene = str_gene + v + ', '
    ret['antibiotics'] = str_gene[:-2]
    return ret


def find_plasmid(plasmid_file):
    set_plasmid = set()
    with open(plasmid_file) as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab')
        for row in reader:
            set_plasmid.add(row['GENE'].strip())
    ret = ''

    for v in set_plasmid:
        ret = ret + v + ', '
    ret = ret[:-2]
    return ret


def export_known_genes(annotation_gff):
    # look for gff file
    if annotation_gff is None:
        return ''
    knowgene = {'genes': []}
    #f = open(gff_file)
    with gzip.open(annotation_gff, 'rt') as f:
        line = f.readline()
        while line:
            if not line.startswith('##'):
                token = line.split('\t')
                if token[1] == 'prokka':
                    # start new gene record
                    # collect position,strain and gene name:
                    contig = token[0]
                    start = int(token[3])
                    end = int(token[4])
                    strain = token[6]
                    tok_des = token[8].split(';')
                    name = ''
                    for s in tok_des:
                        if s.startswith('Name='):
                            name = s.split('=')[1]
                            # collect type and product
                    line = f.readline()
                    token2 = line.split('\t')
                    gene_type = token2[2]
                    tok_des2 = token2[8].split(';')
                    product = ''
                    for s in tok_des2:
                        if s.startswith('product='):
                            product = s.split('=')[1].strip().replace('\'', '')
                    hit = {'contig': contig, 'start': start, 'end': end, 'strain': strain, 'name': name, 'type': gene_type,'product': product}
                    knowgene['genes'].append(hit)
            if line.startswith('##FASTA'):
                break
            # next line
            line = f.readline()

    return knowgene


def save_sample_result(sample, exp_dir):
    sample_dir = os.path.join(exp_dir, 'samples')
    if not os.path.exists(sample_dir):
        os.makedirs(sample_dir)
    json.dump(sample, open(sample_dir + '/' + sample['id'] + ".json", 'w'))


def export_pangenome_summary(summary_file, exp_dir):
    f = open(summary_file)
    ret = {'group': []}
    lines = f.readlines()
    for i in range(len(lines) - 1):
        tok = lines[i].strip().split("\t")
        ret['group'].append({'name': tok[0], 'des': tok[1], 'num': tok[2]})
    ret['total'] = lines[len(lines) - 1].strip().split('\t')[2]
    f.close()
    save_path = exp_dir + "/set/pangenome_summary.json"
    json.dump(ret, open(save_path, 'w'))

    return "/set/pangenome_summary.json"


def export_pangenome_cluster(pre_abs_file, exp_dir):
    ret = {}
    ret['genes'] = []
    #gene_df = pd.read_csv(gene_cluster_file, dtype=str, compression='gzip')
    #gene_df.fillna('', inplace=True)
    # pd.
    with gzip.open(pre_abs_file, 'rt') as tsvfile:
        reader = csv.DictReader(tsvfile, delimiter=',', dialect='excel-tab')
        for row in reader:
            gene = {'gene': row['Gene'],
                    'annotation': row['Annotation'],
                    'noisolates': row['No. isolates'],
                    'nosequences': row['No. sequences'],
                    'length': row['Avg group size nuc']}
            ret['genes'].append(gene)
    save_path = exp_dir + "/set/pangenome_cluster.json"
    json.dump(ret, open(save_path, 'w'))

    return "/set/pangenome_cluster.json"
    # return ret


def export_amr_heatmap(report, exp_dir):
   
    heatmap_stats = {'channels': []}
    channel_by_db={}
    channel_by_db['Virulome genes']=[]
   
    for sample in report['samples']:
        ret = find_amr(sample['resistome'])
        for v in ret['hits']:
            #set_genes.add(v['gene'])
            #set_class.add(v['resistance'])
            if not ('AMR genes-'+v['db']) in channel_by_db:
                channel_by_db[('AMR genes-'+v['db'])]=[]
            
            hit = {'sample': sample['id'],
                   'gene': v['gene'],
                   'type': 'amr',
                   'class': v['resistance'],
                   'identity': float(v['identity'].replace('%', '')),
                   'product': v['product']}
            
            channel_by_db[('AMR genes-'+v['db']) ].append(hit)

        ret = find_virulome(sample['virulome'])
        for v in ret['hits']:
            #set_vir_gene.add(v['gene'])
            # set_class.add(v['resistance'])
            hit = {'sample': sample['id'],
                   'gene': v['gene'],
                   'type': 'vir',
                   'identity': float(v['identity'].replace('%', '')),
                   'product': v['product']}
            # hit['class']=v['class']
            channel_by_db['Virulome genes'].append(hit)
        for m in sample['metadata'].keys():
            if not m in channel_by_db.keys():
                channel_by_db[m]=[]
            hit = {'sample': sample['id'],
                   'gene': sample['metadata'][m],
                   'type': 'meta',
                   'identity': 1,
                   'product':m+"-"+sample['metadata'][m]}
            channel_by_db[m].append(hit)
    for key in channel_by_db.keys():
        channel={'name':key,'hit':channel_by_db[key]}  
        heatmap_stats['channels'].append(channel)
         
    save_path = exp_dir + "/set/amrheatmap.json"
    json.dump(heatmap_stats, open(save_path, 'w'))
    return "/set/amrheatmap.json"


def export_phylogeny_tree(treefile):
    t = Tree(treefile)
    for node in t.get_descendants():
        if node.name == '' and node.dist < 0.00001:
            node.delete()
    data = t.write()
    message_bytes = data.encode('ascii')
    base64_bytes = base64.b64encode(message_bytes)
    base64_message = base64_bytes.decode('ascii')
    return base64_message


def export_msa(report, exp_dir):
    list_genes = os.listdir(report['alignments'])
    alignments = {'alignments': []}
    for gene in list_genes:
        if os.path.isdir(report['alignments'] + '/' + gene):
            tree_file = report['alignments'] + '/' + gene + '/' + gene + '.treefile'
            if not os.path.isfile(tree_file):
                continue
            tree = export_phylogeny_tree(tree_file)
            aln = {'gene': gene, 'tree': tree,
                   'samples': export_alignment(gene, report['alignments'] + '/' + gene, exp_dir)}
            alignments['alignments'].append(aln)

    return alignments


def export_alignment(gene, aln_dir, exp_dir):
    aligments = []
    nu_aln = os.path.join(aln_dir, gene + '.fna.aln.gz')
    nucl_dict = {}
    with gzip.open(nu_aln, 'rt') as fh:
        for record in SeqIO.parse(fh, "fasta"):
            seq = str(record.seq).upper()
            nucl_dict[record.id] = seq
    pro_aln = os.path.join(aln_dir, gene + '.faa.aln.gz')
    with gzip.open(pro_aln, 'rt') as fh:
        for record in SeqIO.parse(fh, "fasta"):
            seq = str(record.seq).upper()
            sample = {'sample': record.id, 'seq': nucl_dict[record.id], 'protein': seq}
            aligments.append(sample)
    if not os.path.exists(exp_dir + "/set/alignments/"):
        os.makedirs(exp_dir + "/set/alignments/")
    save_path = exp_dir + "/set/alignments/" + gene + ".json.gz"
    json.dump(aligments, gzip.open(save_path, 'wt'))

    return "/set/alignments/" + gene + ".json.gz"
    # return aligments


def update_collection_history(export_dir, collection_id, collection_name, status):
    collection_json = os.path.join(export_dir, 'collections.json')
    if not os.path.exists(collection_json):
        # make the empty collection
        collections = {'collections': []}
        with open(collection_json, 'w') as fn:
            json.dump(collections, fn)

    with open(collection_json) as fn:
        collections = json.load(fn)

    # TODO: what the following block does?. what if exist
    is_exist = False
    for col in collections["collections"]:
        if col["collectionID"] == collection_id:
            col["collectionName"] = collection_name
            col["status"] = status
            col["dateModify"] = str(datetime.datetime.now())
            is_exist = True

    if not is_exist:
        collections["collections"].append(
            {"collectionID": collection_id,
             "collectionName": collection_name,
             "dateModify": str(datetime.datetime.now()),
             "status": status})
    with open(collection_json, 'w') as fn:
        json.dump(collections, fn)
