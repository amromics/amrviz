#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    The entry point
"""
from __future__ import division, print_function, absolute_import

import argparse
import logging
import extract_json
import os
import socket
import sys


logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s [%(name)s] %(levelname)s : %(message)s')
logger = logging.getLogger(__name__)

__version__ = '0.9.0'


def start_server_func(args):
    """
    Start the server at the specified  port
    """

    port = args.port
    webapp_dir = args.webapp_dir

    # Check if the port is open
    a_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    location = ("127.0.0.1", port)
    result_of_check = a_socket.connect_ex(location)
    a_socket.close()
    if result_of_check != 0:
        logger.info('Starting server on port {}'.format(port))
        cmd = 'cd {} && live-server --no-browser --port={}  --entry-file=index.html'.format(webapp_dir, port)
        ret = os.system(cmd)
        if ret != 0:
            sys.exit(ret)
    else:
        logger.error('Port {} is not available, server cannot start!'.format(port))


def collection_extract_func(args):
    """

    """

    #TODO: need to make the command line to run pipeline

    collection_id = args.collection_id
    collection_name = args.collection_name
    if not collection_name:
        collection_name = collection_id

    work_dir = args.work_dir
    webapp_dir = args.webapp_dir
    webapp_static_dir = os.path.join(webapp_dir, 'static')

    if not os.path.exists(webapp_static_dir):
        raise Exception('Webapp directory {} not available'.format(webapp_dir))
    webapp_data_dir = os.path.join(webapp_static_dir, 'data')
    if not os.path.exists(webapp_data_dir):
        os.makedirs(webapp_data_dir)

    # Making sure the analysis for the
    cmd = f'amr-analysis.py pg -t {args.threads} -m {args.memory} -i {args.input} -c {collection_id}'
    cmd += f' --work-dir {work_dir} -n "{collection_name}" --genetree'
    if args.time_log is not None:
        cmd += f' --time-log {args.time_log}'
    print(cmd)
    ret = os.system(cmd)
    if ret != 0:
        logger.error('Error running the pipeline')
        exit(1)

    extract_json.export_json(work_dir, webapp_data_dir, collection_id, collection_name)
    logger.info('Congratulations, collection {} is imported to web-app!'.format(collection_id))

def export_result(args):
    webapp_dir = args.webapp_dir
    webapp_static_dir = os.path.join(webapp_dir, 'static')

    if not os.path.exists(webapp_static_dir):
        raise Exception('Webapp directory {} not available'.format(webapp_dir))
    webapp_data_dir = os.path.join(webapp_static_dir, 'data')
    extract_json.export_json(args.work_dir, webapp_data_dir, args.collection_id, args.collection_name)
    logger.info('Exported! Collection {} is imported to web-app!'.format(args.collection_id))
def main(arguments=sys.argv[1:]):
    parser = argparse.ArgumentParser(
        prog='amrviz',
        description='Tool for managing and analyzing antibiotic resistant bacterial datasets')
    parser.add_argument('-V', '--version', action='version', version=__version__)

    subparsers = parser.add_subparsers(title='sub command', help='sub command help')

    pa_cmd = subparsers.add_parser(
        'pa', description='NGS analysis pipeline', help='NGS analysis pipeline',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    pa_cmd.set_defaults(func=collection_extract_func)
    pa_cmd.add_argument('-t', '--threads', help='Number of threads to use, 0 for all', default=0, type=int)
    pa_cmd.add_argument('-m', '--memory', help='Amount of memory in Gb to use', default=30, type=float)
    pa_cmd.add_argument('-c', '--collection-id', help='Collection ID', required=True, type=str)
    pa_cmd.add_argument('-n', '--collection-name', help='Collection name', type=str, default='')
    pa_cmd.add_argument('-i', '--input', help='Input file', required=True, type=str)
    pa_cmd.add_argument('--work-dir', help='Working directory', default='data/work')
    pa_cmd.add_argument('--webapp-dir', help='Webapp directory', default='web-app')
    pa_cmd.add_argument('--time-log', help='Time log file', default=None, type=str)

    start_cmd = subparsers.add_parser(
        'start', description='Start amrviz server', help='Start server',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    start_cmd.set_defaults(func=start_server_func)
    start_cmd.add_argument('-p', '--port', help='The port the server is running on', default=3000, type=int)
    start_cmd.add_argument('--webapp-dir', help='Webapp directory', default='web-app')

    re_export_cmd = subparsers.add_parser(
        'export', description='Export result to wwb app', help='Export to app',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    re_export_cmd.set_defaults(func=export_result )
    re_export_cmd.add_argument('-c', '--collection-id', help='Collection ID', required=True, type=str)
    re_export_cmd.add_argument('-n', '--collection-name', help='Collection name', type=str, default='')
    
    re_export_cmd.add_argument('--work-dir', help='Working directory', default='data/work')
    re_export_cmd.add_argument('--webapp-dir', help='Webapp directory', default='web-app')

    args = parser.parse_args(arguments)
    return args.func(args)


if __name__ == "__main__":
    main()
