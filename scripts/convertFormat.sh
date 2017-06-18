#!/bin/bash
#
# // Converts all files in the /data/ folder to a specified format.
# // $1 toFormat: The destination format.

# for all files in inputDir
# echo convertFormat.sh, $1

for i in /data/*.*; do
  # get the base file name
  FILE=$(basename "$i")

  # remove the file extension (safely)
  FILE="${FILE%.*}"

  echo "$i" "$FILE.$1"

  # convert format and add new file extension
  ffmpeg -i "$i" "/data/$FILE.$1";
done
