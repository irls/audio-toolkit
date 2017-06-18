#!/bin/bash
#
# // Converts all files in the /data/source/ folder to a specified format.
# // $1 toFormat: The destination format.

# for all files in inputDir
echo 'convertFormat.sh, $1'

for i in /data/*.*;
  # get the src file name
  do filepath=`echo $i | cut -d'.' -f1`;
  # convert and place output in outputDir with new extension
  ffmpeg -i "$i" "${filepath}.$1";
done
