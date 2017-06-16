#!/bin/bash
#
# Converts all files in the /data folder to a specified format.
# Parameters:
# $1 (destFormat) = The destination format.

for i in /data/*.*;
  do name=`echo $i | cut -d'.' -f1`;
  ffmpeg -i "$i" "/data/${name}.$1";
done
