import argparse
import os
import csv
import ctypes
import platform
import re
import hashlib
import logging
import sys

INVALID_FILE_CHARS = '[\/:*?"<>|]'

# The base path could be absolute or relative. If you want to be relative to the current folder use ''
BASE_BATH = ''

#Use absolute path or relative to the working folder
LOG_FOLDER = 'log'


class ArgumentParser(argparse.ArgumentParser):
    def error(self, message):
        logging.error(message)
        super(ArgumentParser, self).error(message)


def get_free_space(folder):
    if platform.system() == 'Windows':
        free_bytes = ctypes.c_ulonglong(0)
        ctypes.windll.kernel32.GetDiskFreeSpaceExW(ctypes.c_wchar_p(folder), None, None, ctypes.pointer(free_bytes))
        return free_bytes.value
    else:
        st = os.statvfs(folder)
        return st.f_bavail * st.f_frsize


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("input_file", help="Path to the file that you want to split.")
    parser.add_argument("-s", "--segment", default="segment",
                        help="Column name used for spiting the file. Default: segment")
    parser.add_argument("-t", "--target-folder",
                        help="Folder where the output files will the saved."
                             "Default: in the same folder as the input file")
    parser.add_argument("-cs", "--case-sensitive", help="Make the splitting method case sensitive.",
                        action="store_true")
    parser.add_argument("-f", "--force", help="Overwrite exported files if a file with the same name exists",
                        action="store_true")
    parser.add_argument("-d", "--delimiter", help="File delimiter. Default: ,",
                        default=',')
    parser.add_argument("-q", "--quotechar", help="File Quote char. Default: \"",
                        default='"')
    args = parser.parse_args()
    #for arg in sys.argv:
    #    print ' '.join(arg)
    return args


def process_file(input_file, segment, case_sensitive=False, delimiter=',', quotechar='"'):
    """

    :param input_file:
    :param segment:
    :param case_sensitive:
    :param delimiter:
    :param quotechar:
    :return:
    """
    data = {}
    header = []
    segment_position = -1;

    try:
        with (open(input_file, 'rb')) as csvfile:
            csv_reader = csv.reader(csvfile, delimiter=delimiter, quotechar=quotechar)
            for row in csv_reader:
                if len(header) == 0:
                    i = 0
                    header = row
                    for key in header:
                        if key.lower().strip() == segment.lower().strip():
                            segment_position = i
                        i += 1
                    if segment_position is -1:
                        msg = "[{}] The column '{}' was not found in the file".format(input_file, segment)
                        print msg
                        logging.error(msg)
                        exit(202)
                else:
                    segment = row[segment_position].strip()
                    if case_sensitive is False:
                        segment = segment.lower()
                    if segment != re.sub(INVALID_FILE_CHARS, '', segment):
                        segment = "ErrorRows"
                    if segment not in data:
                        data[segment] = []
                        data[segment] += [header]
                    data[segment] += [row]

    except IOError as e:
        msg = "[{}] The input file '{}' doesn't exists.".format(input_file, input_file)
        print msg
        logging.error(msg)
        exit(100)
    return data


def get_file_name(key, keys, prefix, extension):
    """

    :param key:
    :param keys:
    :param prefix:
    :param extension:
    :return:
    """
    i = 0
    for temp_key in keys:
        if key.lower() == temp_key.lower():
            i += 1
    if i > 1:
        # Add md5 offset
        md5 = hashlib.md5()
        md5.update(key)
        return "{}_{}_{}{}".format(prefix, key, md5.hexdigest(), extension)
    return "{}_{}{}".format(prefix, key, extension)


def save_files(data, prefix, extension, target_folder, force=False, delimiter=',', quotechar='"'):
    """

    :param data:
    :param prefix:
    :param extension:
    :param target_folder:
    :param force:
    :param delimiter:
    :param quotechar:
    """
    for key in data:

        target_file = os.path.join(target_folder, get_file_name(key, data.keys(), prefix, extension))
        try:
            if force is False and os.path.exists(target_file):
                msg = "[{}{}] The target file '{}' exists. use -f to overwrite".format(prefix, extension, target_file)
                print msg
                logging.warning(msg)
            else:
                with (open(target_file, 'wb+')) as file:
                    csv_writer = csv.writer(file, delimiter=delimiter, quotechar=quotechar)
                    for row in data[key]:
                        csv_writer.writerow(row)
                    msg = "[{}{}] Created file {}".format(prefix, extension, target_file)
                    print msg
                    logging.info(msg)
        except IOError as e:
            msg = "[{}{}] The target file isn't writable".format(prefix, extension)
            print msg
            logging.error(msg)
            exit(102)


def main():
    if not os.path.exists(LOG_FOLDER):
        os.makedirs(LOG_FOLDER)

    logging.basicConfig(filename=os.path.join(LOG_FOLDER, 'file_split.log'), level=logging.DEBUG,
                        format='%(asctime)s [%(process)d] [%(levelname)s ] %(message)s')

    logging.info("Start Run")
    arg_string = ''
    for arg in sys.argv:
        arg_string = arg_string + " " + arg

    logging.info("Parameters: " + arg_string)
    args = parse_args()

    if os.path.isabs(args.input_file) is False:
        input_file = os.path.abspath(os.path.join(BASE_BATH, args.input_file))
    else:
        input_file = os.path.abspath(args.input_file)

    target_folder = os.path.dirname(input_file)
    base_file_name = os.path.basename(input_file)

    if args.target_folder:
        target_folder = os.path.abspath(args.target_folder)
    if os.path.isdir(target_folder) is False:
        msg = "[{}] The target path '{}' isn't a directory".format(base_file_name, target_folder)
        logging.error(msg)
        print msg
        exit(101)

    data = process_file(input_file, args.segment, args.case_sensitive, args.delimiter, args.quotechar)

    if get_free_space(target_folder) < os.stat(input_file).st_size:
        msg = "[{}] Not enough free space on target drive".format(base_file_name)
        logging.error(msg)
        print msg
        exit(200)

    if len(data) == 0:
        msg = "[{}] The input file is empty".format(base_file_name)
        print msg
        logging.error(msg)
        exit(201)

    prefix = os.path.splitext(base_file_name)[0]
    extension = os.path.splitext(base_file_name)[1]
    save_files(data, prefix, extension, target_folder, args.force, args.delimiter, args.quotechar)

    logging.info("End Run")

if __name__ == "__main__":
    main()
