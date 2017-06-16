#!/bin/bash
#
# Merges all files in the /data folder and saves to destFile, converting format if necessary.
# Parameters:
# $1 (destFileName) = The destination filename, including extension.

ffmpeg -f concat -safe 0 -i <(for f in /data/*.*; do echo "file '$f'"; done) -c copy /data/$1
