
# AMRViz


## Welcome to AMRViz

**AMR-Viz** is a package for genomics analysis antimicrobial resistant bacteria. 
The core of AMRViz is a pipeline that bundles the current best practice for 
multiple aspects of genomics AMR analyses. The pipeline analysis results are 
presented and visualized via a web application. AMRViz also provides a dashboard for 
efficiently manage AMR genomic projects and data.

AMRViz is written in python and its web back-end is implemented with nodejs. 
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

## Installation

AMRViz offers multiple methods to install on a computer system. Users will need to
check out the repository containing the setting neccessary for running AMRViz.

```bash
git clone --recursive https://github.com/amromics/amrviz
cd amrviz
```

The instructions below assume working from the root directory for the repositorys.

### Via conda

AMRViz can be installed into a conda environment with the following steps:

0. Download and install the appropriate conda, such as anaconda from 
   https://repo.anaconda.com/archive/
   
1. Create a conda environment with all the necessary dependencies: 
```bash
conda create -y -c conda-forge -c defaults --name amromics python=3.7 mamba
source activate amromics
mamba install -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults  --file submodules/amromics/requirements.txt
```

2. Activate amromics environment and install amromics library and script
```bash
source activate amromics
(cd submodules/amromics && pip install . --use-feature=in-tree-build) 

```

3. Install nodejs
```bash
mamba install -y -c conda-forge  nodejs==14.8.0
npm install -g live-server
```

4. (Optional) Setup and build web application using npm 

```bash
npm install
npm run build --modern
```

### Via docker

We provide a docker container, namely `amrpmics/amrviz` for AMRViz application. 
To use AMRViz docker, make sure that docker is installed on your system.

## Usage

AMR-viz comprises two components: a web application and an analysis pipeline. To start
the web server, run the following command from **amrviz** root directory 

```bash
./amrviz.py start [-p 3000] [--webapp-dir web-app]
```

The web application is auto opened on the URL **localhost:3000** (or another 
port if this port is occupied). 

To run the pipeline, users need to provide a tsv file listing the samples and input
data in either fastq (sequencing reads) or fasta (assemply). We provide the following
examples:

#### Miniature dataset example

We prepare a small dataset consisting of 5 Klebsiella pneumoniae samples, 
including one reference sequence, to test the software. To download the raw data 
for the dataset:
```bash
cd examples/Kp89/raw
./download_mini.sh
cd ../../..
```
With the following command, the system will perform genomics analysis, 
including pan-genome analysis of the five samples and import the results to 
the web-app for visualization:

```bash
./amrviz.py pa -t 8 -m 15 -c KpMini -i examples/Kp89/config_mini.tsv --work-dir data/work --webapp-dir web-app/  -n "Collection of 4 MDR clinical Kp isolates"
```

#### Case study example
To analyze another dataset including 89 Klebsiella pneumoniae samples, 
run the following commands to download the raw data:

```bash
cd examples/Kp89/raw
./download.sh
cd ../../
```

The following command will run that 89 samples through the pipeline, and import the results
to the web-app for visualization:

```bash
./amrviz.py pa -t 8 -m 15 -c KpMDR89 -i examples/Kp89/config_Kp89.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of 89 MDR clinical Kp in Kathmandu"
```

### Usage with docker
For using docker, please replace the command `./amrviz.py` by 
`docker run -v ``pwd``:/misc/amrviz --publish 3000:3000 amrviz amrviz.py`. For example

To start the web-server
```bash
docker run -v `pwd`:/misc/amrviz --publish 3000:3000 amrviz amrviz.py start --webapp-dir /misc/amrviz/web-app
```

To run a pipeline:
```bash
docker run -v `pwd`:/misc/amrviz amrviz amrviz.py pa -t 8 -m 15 -c KpMDR89 -i examples/Kp89/config_Kp89.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of 89 MDR clinical Kp in Kathmandu"
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
