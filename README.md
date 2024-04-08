
# AMRViz


## Welcome to AMRViz

**AMR-Viz** is a package for genomics analysis of antimicrobial resistant (AMR) bacteria. 
The core of AMRViz is a pipeline that bundles the current best practices for 
end-to-end AMR genomics analyses. The pipeline analysis results are 
presented and visualized via a web application. AMRViz also provides a dashboard for 
efficient management of AMR genomic projects and data.

AMRViz is written in *python* and its web back-end is implemented with *nodejs*. 
It includes the followings dependencies:
 * blast (known to work with 2.10.1+)
 * samtools (1.11)
 * trimmomatic (0.39)
 * spades (3.14.1)
 * shovill (1.1.0)
 * prokka (1.14.6)
 * mlst (2.19.6)
 * abricate (1.0.1 | Database: vfdb ecoli_vf ecoh card megares resfinder argannot ncbi plasmidfinder)
 * roary (3.13.0)
 * iqtree (2.1.2)


## Getting started

AMRViz is cross-platform and can be installed via *conda* or *docker*.



### Installation with conda

AMRViz can be installed on a Unix-like machine running conda. It can also run on Windows
machines via WSL. Follow the instructions [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10) 
to set up WSL on Windows. Make sure that a conda container such as 
[anaconda](https://www.anaconda.com/) or 
[miniconda](https://docs.conda.io/en/latest/miniconda.html)
is installed. 

Instructions:

1. Check out the github AMRViz repository and change directory to the root of the repository
```bash
git clone --recursive https://github.com/amromics/amrviz
cd amrviz
```

The instructions below assume working from the root directory for the repository.
   
2. Create a conda environment named `amromics` with all the necessary dependencies.  

```bash
conda create -y -c conda-forge -c defaults --name amromics python=3.10 mamba
source activate amromics

#Install dependencies
mamba install -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults  --file submodules/amromics/requirements.txt
pip install panta

#Install amromics
(cd submodules/amromics && pip install .) 

```

For all subsequent steps, assume that environment `amromics` is activated.

3. Extract databases
   
```bash
tar zxvf submodules/amromics/db.tar.gz

```

4. Install *nodejs*

```bash
mamba install -y -c conda-forge  nodejs==14.8.0
npm install -g live-server
```

<!--
5 (Optional) Setup and build web application using *npm*

```bash
npm install
npm run build --modern
```

### Installation with docker
We provide a docker container, namely amromics/amrviz for AMRViz application. 
To use AMRViz docker, make sure that docker is installed on your system. Installation
for docker requires only the first two steps as above.
-->

Once all the packages are installed, the web-based platform can be started (once only) by

```bash
./amrviz.py start -p 3000 --webapp-dir web-app/

```
 
Here, port 3000 is assumed. If the port is not available, please choose another number. Once the server has been started, the platform can be accessed via a web-browser at the address http://localhost:3000/.


### Case studies 

To illustrate AMRViz usage, we prepare several datasets and instructions how to analyze the.

##### Kp100

The Kp100 dataset consists of 89 Klebsiella pneumoniae samples sequenced with Illumina technology, 11 samples with Oxfort Nanopore and 1 sample with Pacbio. The ENA accessions for these samples are listed in `examples/Kp100/raw/acc_list.csv`. We also include two reference genomes in the dataset.
   
To prepare the input data for the case study, run

```bash
(cd examples/Kp100/raw && ./download_acsp.sh)
```
This might take a few hours depending on the network connection. Alternatively, you can use your favourite download tools to download the listed accessions.

We also provide a miniature dataset which is a subset of 7 samples of the Kp100 dataset. To download the raw data for the miniature dataset

```bash
(cd examples/Kp100/raw && ./download_mini.sh)
```

To run the pipeline, users need to provide a *tsv* file listing the samples and input
data in either *fastq* (sequencing reads) or *fasta* (assemply). The input file for the 
Kp100 dataset is under `examples/Kp100/raw/config_K100.tsv`

To perform analysis on the Kp100 dataset, and to import to the web platform, run the followint command line.
Adjust the number of cpus and the amount of memory allocated for running analysis according to the hardware configuration of your computer.

```bash
./amrviz.py pa  -t 20 -m 28 -c Kp100 -i examples/Kp100/config_Kp100.tsv --work-dir data/work --webapp-dir web-app/  -n "Collection of 103 MDR clinical Kp isolates"
```

For analyzing the miniature dataset
```bash
./amrviz.py pa  -t 20 -m 28 -c KpMini -i examples/Kp100/config_mini.tsv --work-dir data/work --webapp-dir web-app/  -n "Mini collection 7 Kp isolates"
```


##### iGAS70
This dataset contains 76 Steptococcus pyogenes samples. To download the raw data for the dataset

```bash
(cd examples/iGAS70/raw && ./download_ascp.sh)
```

To analyze the dataset
```bash
./amrviz.py pa -t 20 -m 25 -c iGAS70 -i examples/iGAS70/config_iGAS70.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of >70 Steptococcus pyogenes from MDU-Australia."
```

##### Kp24
This dataset contains 24 Klebsiella pneumoniae samples. To download the raw data for the dataset

```bash
(cd examples/Kp24/raw && ./download_kp24_ascp.sh)
```

To analyze the dataset
```bash
./amrviz.py pa -t 20 -m 25 -c KpMDR -i examples/Kp24/config_Kp24.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of MDR Klebsiella pneumoniae"
```


<!--
```bash
# with docker installation 
docker run -v `pwd`:/misc/amrviz -w /misc/amrviz amromics/amrviz /bin/bash -c 'cd examples/Kp89/raw/;bash download_mini.sh'
```

#### Start web-server

AMR-viz comprises two components: a web application and an analysis pipeline. To start
the web server, run the following command from **amrviz** root directory

```bash
# with conda installation
./amrviz.py start -p 3000 --webapp-dir web-app/
```

```bash
# with docker installation
docker run -v `pwd`:/misc/amrviz -w /misc/amrviz  --publish 3000:3000  amromics/amrviz amrviz.py start --webapp-dir web-app/ --port 3000
```

The web application is auto opened on the URL **localhost:3000** (or another port if this port is occupied). 
-->


With the following command, the system will perform genomics analysis, 
including pan-genome analysis of the five samples and import the results to 
the web-app for visualization:


```bash
cd examples/iGAS70/raw
./download_ascp.sh
cd ../../
```

The following command will run those 76 samples through the pipeline, and import the results
to the web-app for visualization:


<!--

#### Prepare input file
- Data file inputted for analysis needs to be in *.tsv* format 
((To-do: Check if .tsv format is required)) and follows specific requirements. 
Please check the sample input file *data/samples/set1.tsv* for an example.
- Note:
  + Column names need to be as follow:
    - sample_id	
    - sample_name	
    - input_type	
    - files	
    - genus	
    - species	
    - strain	
    - gram	
    - metadata
  + *gram* column should be empty. ((To-do: Delete gram column?))
  + *metadata* is empty or in the format: key1:value1;key2:value2;...  
  For example: Geographic Location:Houston,USA;Insert Date:8/8/2017;Host Name:Human, Homo sapiens;ampicillin:Resistant;aztreonam:Resistant;ciprofloxacin:Resistant;gentamicin:Susceptible;tetracycline:Susceptible

-->
