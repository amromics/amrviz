
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

1. Check out the github AMRViz repository.
```bash
git clone --recursive https://github.com/amromics/amrviz
```

2. Change to the root directory for the repository and extract database

```bash
cd amrviz
tar zxvf db.tar.gz
```
The instructions below assume working from the root directory for the repository.
   
3. Create a conda environment named `amromics` with all the necessary dependencies: 

```bash
conda create -y -c conda-forge -c defaults --name amromics python=3.7 mamba=0.13.0
source activate amromics
mamba install -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults  --file submodules/amromics/requirements.txt
```

4. Activate `amromics` environment and install amromics library and script

```bash
source activate amromics
(cd submodules/amromics && pip install . --use-feature=in-tree-build) 

```

5. Install *nodejs*

```bash
mamba install -y -c conda-forge  nodejs==14.8.0
npm install -g live-server
```

6. (Optional) Setup and build web application using *npm*

```bash
npm install
npm run build --modern
```

### Installation with docker
We provide a docker container, namely amromics/amrviz for AMRViz application. 
To use AMRViz docker, make sure that docker is installed on your system. Installation
for docker requires only the first two steps as above.

### Usage

#### Prepare a miniature dataset

To illustrate AMRViz usage, we prepare a small dataset consisting of 5 Klebsiella pneumoniae 
samples, including one reference sequence, to test the software. To download the raw data 
for the dataset:

```bash
# with conda installation 
cd examples/Kp89/raw
./download_mini.sh
cd ../../..
```


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

#### Analyze the miniature dataset

To run the pipeline, users need to provide a *tsv* file listing the samples and input
data in either *fastq* (sequencing reads) or *fasta* (assemply). The input file for the 
miniature dataset is under ` examples/Kp89/config_mini.tsv`


With the following command, the system will perform genomics analysis, 
including pan-genome analysis of the five samples and import the results to 
the web-app for visualization:

```bash
# with conda instalation
./amrviz.py pa -t 8 -m 15 -c KpMini -i examples/Kp89/config_mini.tsv --work-dir data/work --webapp-dir web-app/  -n "Collection of 4 MDR clinical Kp isolates"
```

```bash
# with docker instalation
docker run  -v `pwd`:/misc/amrviz -w /misc/amrviz amromics/amrviz amrviz.py pa -t 8 -m 15 -c KpMini -i examples/Kp89/config_mini.tsv --work-dir data/work --webapp-dir web-app/  -n "Collection of 4 MDR clinical Kp isolates 2"
```

#### Known issues

- For MacOS and Windows/WSL, one of the steps of the assembly process (`kmc`) 
  crashes with the the conda installation. If your collection includes samples needed
  assemby (ie in fastq input data), please set the estimated genome size (`gsize`) to bypass running kmc. See `examples/Kp89/config_mini.tsv` for example.

### Case study example
To analyze another dataset including 89 Klebsiella pneumoniae samples, 
run the following commands to download the raw data:

```bash
cd examples/Kp89/raw
./download.sh
cd ../../
```

The following command will run those 89 samples through the pipeline, and import the results
to the web-app for visualization:

```bash
./amrviz.py pa -t 8 -m 15 -c KpMDR89 -i examples/Kp89/config_Kp89.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of 89 MDR clinical Kp in Kathmandu"
```




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
