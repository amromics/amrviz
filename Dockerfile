FROM continuumio/miniconda3
MAINTAINER AMRomics AMRviz <amromics@gmail.com>


WORKDIR /misc


# Dependencies
RUN apt-get update &&  apt-get install -y time
RUN conda update --all

COPY submodules/amromics/amromics /misc/amromics/amrviz/submodules/amromics/amromics
COPY submodules/amromics/requirements.txt /misc/amromics/amrviz/submodules/amromics/
COPY submodules/amromics/setup.py /misc/amromics/amrviz/submodules/amromics/
COPY submodules/amromics/amr-analysis.py /misc/amromics/amrviz/submodules/amromics/
#COPY web-app /misc/amromics/amrviz/web-app
COPY amrviz.py /misc/amromics/amrviz
COPY extract_json.py /misc/amromics/amrviz

RUN conda install -y -c conda-forge python=3.7 mamba
RUN mamba install -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults  --file /misc/amromics/amrviz/submodules/amromics/requirements.txt

RUN cd /misc/amromics/amrviz/submodules/amromics && pip install .

RUN mamba install -y -c conda-forge  nodejs==14.8.0
RUN npm install -g live-server
ENV PATH="/misc/amromics/amrviz:${PATH}" PYTHONPATH="/misc/amromics/amrviz:$PYTHONPATH"


