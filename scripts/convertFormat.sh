#!/bin/bash
#
# // Converts all files in the /data/ folder to a specified format.
# // $1 toFormat: The destination format.

# for all files in inputDir
#echo convertFormat.sh, $1

for i in /data/*.*; do
  # remove the file extension (safely)
  FILE="${i%.*}"
  # convert format and add new file extension
  ffmpeg -i "$i" "$FILE.$1";
done
