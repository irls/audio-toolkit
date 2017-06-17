#!/bin/bash
#
# // Converts all files in the /data/source/ folder to a specified format.
# // $1 toFormat: The destination format.
# // $2 inputDir: subfolder containing source files, should be "input/"
# // $3 outputDir: subfolder with converted files, should be "output/"

# for all files in inputDir
for i in /data/$2*.*;
  # get the src file name
  do name=`echo $i | cut -d'.' -f1`;
  # convert and place output in outputDir with new extension
  ffmpeg -i "$i" "$3${name}.$1";
done
