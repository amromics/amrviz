#!/bin/bash
#Install IBM aspera-connect 4.1.3 (note that latest version doesn't work):
if [ ! -f ~/.aspera/connect/bin/ascp ] || [ ! -f ~/.aspera/connect/etc/asperaweb_id_dsa.openssh ]
then
  wget https://ak-delivery04-mul.dhe.ibm.com/sar/CMA/OSA/0adrj/0/ibm-aspera-connect_4.1.3.93_linux.tar.gz
  tar zxvf ibm-aspera-connect_4.1.3.93_linux.tar.gz
  bash ibm-aspera-connect_4.1.3.93_linux.sh && rm ibm-aspera-connect_4.1.3.93_linux.*
fi
export PATH=~/.aspera/connect/bin/:$PATH
KEYPATH=~/.aspera/connect/etc/asperaweb_id_dsa.openssh

#Download FASTA assembly
[ ! -f GCF_002055535.1_NCTC8198_genomic.fna.gz ] && wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/002/055/535/GCF_002055535.1_NCTC8198/GCF_002055535.1_NCTC8198_genomic.fna.gz
[ ! -f GCF_004028355.1_ASM402835v1_genomic.fna.gz ] && wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/004/028/355/GCF_004028355.1_ASM402835v1/GCF_004028355.1_ASM402835v1_genomic.fna.gz
[ ! -f GCF_006364235.1_ASM636423v1_genomic.fna.gz ] && wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/006/364/235/GCF_006364235.1_ASM636423v1/GCF_006364235.1_ASM636423v1_genomic.fna.gz
[ ! -f GCF_022869605.1_ASM2286960v1_genomic.fna.gz ] && wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/022/869/605/GCF_022869605.1_ASM2286960v1/GCF_022869605.1_ASM2286960v1_genomic.fna.gz


#Download pair-ended reads from SRR
rm sra*txt
awk -F"," 'NR>1{print $1}' SraRunTable.csv | parallel -j 16 'curl -X GET "https://www.ebi.ac.uk/ena/portal/api/filereport?accession={}&fields=fastq_ftp&result=read_run" 2>/dev/null | sed -n "2 p" >> sra_pe.ftp.txt'

# FTP download is slow too, convert to fasq link to download by ascp
sed 's/;/\t/g' sra_pe.ftp.txt | sed 's/ftp.sra.ebi.ac.uk\//era-fasp@fasp.sra.ebi.ac.uk:/g' > sra_pe.ascp.txt
totN=$(cat sra_pe.ascp.txt|wc -l)
curN=0
while read r1 r2 s
do
	curN=$((curN + 1))
	echo "Downloading $s...($curN/$totN) short-reads data:"
	[ -f ${s}_1.fastq.gz ] && echo "${s}_1.fastq.gz exist...skip" || ascp -QT -l 300m -P33001 -i "${KEYPATH}" "${r1}" .
	[ -f ${s}_2.fastq.gz ] && echo "${s}_2.fastq.gz exist...skip" || ascp -QT -l 300m -P33001 -i "${KEYPATH}" "${r2}" .
	echo "Finish download $s."
done < sra_pe.ascp.txt

