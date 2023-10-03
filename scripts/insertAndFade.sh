#!/bin/bash
#

# Insert fragFile into inputFile at position and fade edges

# $1 inputFile: The file name of the source audio, with extension.
# $2 fragFile: The fragment to be inserted
# $3 outputFile: The output filename.
# $4 position: The position at which the source file should be split.
# $5 leftFade: The length of left fade.
# $6 rightFade: The length of right fade.
# $7 append: If need to append file at the end.

ext="${1##*.}"

inputFile="$1"
fragFile="$2"
outputFile="$3"
position="$4"
leftFade="$5"
rightFade="$6"
append="$7"

noLeft=$(echo "$position <= 0" | bc -l)

tmpDir="/data/fadeTmp"

mkdir "$tmpDir"

rightPartFade="$tmpDir/right_f.$ext"
leftPartFade="$tmpDir/left_f.$ext"
leftPart="$tmpDir/left.$ext"
rightPart="$tmpDir/right.$ext"

if [ $noLeft -eq 1 ]
then
# Fade in inputFile and prepend fragFile at the beginning of inputFile
# fade in from the beginning
ffmpeg -hide_banner -y -i "/data/$inputFile" -af "afade=t=in:st=$position:d=$rightFade" "$rightPartFade"
# concat files
ffmpeg -hide_banner -y -i "$fragFile" -i "$rightPartFade" -filter_complex '[0:0][1:0]concat=n=2:v=0:a=1[out]' -map '[out]' "/data/$outputFile"

elif [ "$append" = "1" ]
then
# Fade out inputFile at the end and append fragFile
fadeOutStart=$(printf %.2f $(expr $position-$leftFade | bc -l))
# fade out
ffmpeg -hide_banner -y -i "/data/$inputFile" -af "afade=t=out:st=$fadeOutStart:d=$leftFade" "$leftPartFade"
# concat files
ffmpeg -hide_banner -y -i "$leftPartFade" -i "$fragFile" -filter_complex '[0:0][1:0]concat=n=2:v=0:a=1[out]' -map '[out]' "/data/$outputFile"

else
fadeOutStart=$(printf %.2f $(expr $position-$leftFade | bc -l))
# Make two files from inputFile: fade out file till position and fade in file from position and concat them with fragFile

# fade out
ffmpeg -hide_banner -y -i "/data/$inputFile" -af "afade=t=out:st=$fadeOutStart:d=$leftFade" "$leftPartFade"
# take fade out file part till position
ffmpeg -hide_banner -y -i "$leftPartFade" -af "atrim=start=0:end=$position" "$leftPart"

# fade in
ffmpeg -hide_banner -y -i "/data/$inputFile" -af "afade=t=in:st=$position:d=$rightFade" "$rightPartFade"
# take fade in part from position
ffmpeg -hide_banner -y -i "$rightPartFade" -af "atrim=start=$position" "$rightPart"

# concat files
ffmpeg -hide_banner -y -i "$leftPart" -i "$fragFile" -i "$rightPart" -filter_complex '[0:0][1:0][2:0]concat=n=3:v=0:a=1[out]' -map '[out]' "/data/$outputFile"

fi

rm -rf "$tmpDir"