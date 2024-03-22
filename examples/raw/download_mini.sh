#!/bin/bash


if [ ! -f GCF_000016305.1_ASM1630v1_genomic.fna.gz ];then
    wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/016/305/GCF_000016305.1_ASM1630v1/GCF_000016305.1_ASM1630v1_genomic.fna.gz
fi

for ac in ERR349747 ERR349756 ERR349757 ERR349758;do
    if [ ! -f ${ac}_2.fastq.gz ];then
        echo " Downloading Accession ${ac} ..."
        fasterq-dump --progress --split-3 ${ac} && gzip ${ac}_1.fastq && gzip ${ac}_2.fastq
    else
        echo " Accession ${ac} has been downloaded!"
    fi
done



# long reads
for ac in SRR10176979 SRR1185120;do
    if [ ! -f ${ac}.fastq.gz ];then
        echo " Downloading Accession ${ac} ..."
        fastq-dump ${ac} && gzip ${ac}.fastq
    else
        echo " Accession ${ac} has been downloaded!"
    fi
done
