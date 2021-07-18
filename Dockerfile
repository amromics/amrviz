FROM continuumio/miniconda3
MAINTAINER AMRomics AMRviz <amromics@gmail.com>


WORKDIR /misc


# Dependencies
RUN apt-get update && \
    apt-get install -y parallel make cmake wget git locales time
RUN conda update --all
COPY submodules /misc/amromics/amrviz/submodules
COPY web-app /misc/amromics/amrviz/web-app
COPY amrviz.py /misc/amromics/amrviz
COPY extract_json.py /misc/amromics/amrviz
RUN conda install  -y -c conda-forge -c bioconda -c anaconda -c etetoolkit -c defaults  --file /misc/amromics/amrviz/submodules/amromics/requirements.txt
RUN cd /misc/amromics/amrviz/submodules/amromics && pip install .
RUN conda install -y -c conda-forge  nodejs==14.8.0
RUN npm install -g live-server
ENV PATH="/misc/amromics/amrviz:${PATH}" PYTHONPATH="/misc/amromics/amrviz:$PYTHONPATH"


