#!/bin/bash
#
# // Converts all files in the /data/source/ folder to a specified format.
# // $1 (toFormat): The destination format.
# // $2 (srcDir): subfolder containing source files, should be "source/"
# // $3 (destDir): subfolder with converted files, should be "dest/"

# for all files in srcDir
for i in /data/$2*.*;
  # get the src file name
  do name=`echo $i | cut -d'.' -f1`;
  # convert and place output in destDir with new extension
  ffmpeg -i "$i" "$3${name}.$1";
done
