
# AMR-Viz


## Welcome to AMR-Viz

**AMR-Viz** is a package for genomics analysis antimicrobial resistant bacteria. 
The core of AMR-Viz is a pipeline that bundles the current best practice for 
multiple aspects of AMR analyses. The pipeline analysis results are 
represented and visualized via a web application. The web application also 
provides efficient data management.
 
AMR-Viz is written in python, and its web back-end is implemented with nodejs. 
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

The simplest method is installed via conda:

0. Download and install the appropriate conda, such as anaconda from 
   https://repo.anaconda.com/archive/
   
1. Create a conda environment with all the necessary dependencies: 
```bash
conda create -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults --name amromics --file submodules/amromics/requirements.txt
```
2. Activate amromics environment and install amromics library and script
```bash
source activate amromics
(cd submodules/amromics && pip install . --use-feature=in-tree-build) 

```

3. Install nodejs
```bash
conda install -y -c conda-forge  nodejs==14.8.0
npm install -g live-server
```

4. (Optional) Setup and build web application using npm 

```bash
npm install
npm run build --modern
```
## Build docker images
```bash
docker build -f Dockerfile -t amrviz .
```

## Usage

AMR-viz comprises two components: a web application and an analysis pipeline. 

### To run the web application
Change the current working directory to the **amrvis** cloned directory 
in the step 4 of Intallation above.
```bash
./amrviz.py start [-p 3000] [--webapp-dir web-app]
```

The web application is auto opened on the URL **localhost:3000** (or another 
port if this port is occupied). 

### To run the pipeline

### Examples

#### Miniature dataset


We prepare a small dataset consisting 6 Klebsiella pneumoniae samples, including two reference sequences, test the softare. To download the raw data for the dataset:
```bash
cd examples/Kp24/raw
./download_Kp4.sh
cd ../../

```
With the following command, the system will perform genomics analysis, including pan-genome analysis of the six samples and import the results to the web-app for visualization:

```bash
./amr-analysis.py pg --time-log k24_time.log  -t 7 -m 25 -c KpClinicalGRBZ -i examples/Kp24/Kp24.tsv --work-dir data/work  -n "Collection of 24 clinical isolates from Greek and Brazil"
```


#### Case study
To analyze another dataset including 24 Klebsiella pneumoniae samples, run the following commands to download the raw data:

```bash
cd examples/Kp24/raw
./download.sh
cd ../../
```

The following command will run that 24 samples through the pipeline, and import the results
to the web-app for visualization:

```bash
./amrviz.py pa --time-log k24_time.log  -t 7 -m 25 -c KpClinicalGRBZ -i examples/Kp24/Kp24.tsv --work-dir data/work --webapp-dir web-app  -n "Collection of 24 clinical isolates from Greek and Brazil"
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
## Usage with docker
### Prepare folder structure
AMRVIz need to mount 4 folder : downloaded database folder, examples folder (input folder), output folder, web-app working folder. For first time running, keep database,output and web-app data folders are empty. Organize input files and tsv files listing samples in examples folder with (like examples folder in git repo). While using AMRVIZ, do not modify database folder and web-app folder. 
 
### To run the pipeline

```bash
docker run -it -v /path/to/db:/misc/db -v /path/to/examples:/misc/examples -v  /path/to/output/data:/misc/amromics/amrviz/data -v  /path/to/web-app/data:/misc/amromics/amrviz/web-app/static/data amrviz amrviz.py pa --time-log k24_time.log  -t 7 -m 25 -c KpClinicalGRBZ4 -i /misc/examples/Kp24/config_Kp4.tsv --work-dir /misc/amromics/amrviz/data/work --webapp-dir /misc/amromics/amrviz/web-app  -n "Collection of 4 clinical isolates from Greek and Brazil"

```
### To run the web application
docker run -it -v  /path/to/web-app/data:/misc/amromics/amrviz/web-app/static/data --publish 3000:3000 amrviz amrviz.py start --webapp-dir /misc/amromics/amrviz/web-app
