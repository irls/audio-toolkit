#!/bin/bash
#
# Gets part of the inputFile, starting from start position with duration duration and saves it to the outputFile

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for the audio result file.
# $3 start: Fade start.
# $4 end: Fade end.
# $5 percent: Percent of volume of middle part.
# $6 fadeLength: Fade length.

# run task

inputFile="$1"
outputFile="$2"
startPos="$3"
endPos="$4"
percent="$5"
fadeLength=$6

ext="${1##*.}"

fadePart=$(expr 100 - $percent | bc)
echo "fadePart $fadePart"
echo "$fadeLength * $percent / $fadePart"
delta=$(printf %.2f $(expr $fadeLength*$percent/$fadePart | bc -l))

leftEnd=$(printf %.2f $(expr $startPos+$fadeLength | bc -l))
rightStart=$(printf %.2f $(expr $endPos-$fadeLength | bc -l))
rightFadeStart=$(printf %.2f $(expr $endPos-$fadeLength-$delta | bc -l))
middleStart=$(printf %.2f $(expr $startPos+$fadeLength | bc -l))
middleEnd=$(printf %.2f $(expr $endPos-$fadeLength | bc -l))
fadeDuration=$(printf %.2f $(expr $fadeLength+$delta | bc -l))
middleVolume=$(printf %.2f $(expr $percent/100 | bc -l))
middleLength=$(printf %.2f $(expr $middleEnd-$middleStart | bc -l))
noMiddle=$(echo "$middleLength <= 0" | bc -l)
tmpDir="/data/fadeTmp"

checkRightFadeStart=$(echo "$rightFadeStart < 0" | bc -l)

if [ $checkRightFadeStart -eq 1 ]
then
rightFadeStart=0
fi

checkFadeLength=$(echo "$fadeDuration <= 0" | bc -l)

if [ $checkFadeLength -eq 1 ]
then
fadeDuration=0.01
fi


# noFade - fade length is too small, just take middle part and lower its volume, no fade in fade out
noFade=$(echo "$fadeLength <= 0" | bc -l)

if [ $noFade -eq 1 ]
then
fadeDuration=0
fi

echo "delta $delta"
echo "leftEnd $leftEnd"
echo "rightStart $rightStart"
echo "rightFadeStart $rightFadeStart"
echo "middleStart $middleStart"
echo "middleEnd $middleEnd"
echo "fadeDuration $fadeDuration"
echo "middleVolume $middleVolume"
echo "middleLength $middleLength"
echo "noMiddle $noMiddle"
echo "noFade $noFade"

if [ $noMiddle -eq 1 ]
then
echo "MIDDLE EQUAL 0"
else
echo "MIDDLE NOT EQUAL 0"
fi

mkdir "$tmpDir"

leftSource="$inputFile"
rightSource="$inputFile"

if [ $noFade -eq 0 ]
then

leftSource="$tmpDir/left_f.$ext"
# fade out left part
ffmpeg -hide_banner -y -i "$inputFile" -af "afade=t=out:st=$startPos:d=$fadeDuration" "$leftSource"

rightSource="$tmpDir/right_f.$ext"
# fade in right part
ffmpeg -hide_banner -y -i "$inputFile" -af "afade=t=in:st=$rightFadeStart:d=$fadeDuration" "$rightSource"
fi

# left part of audio
ffmpeg -hide_banner -y -i "$leftSource" -af "atrim=start=0:end=$leftEnd" "$tmpDir/left.$ext"

# right part of audio
ffmpeg -hide_banner -y -i "$rightSource" -af "atrim=start=$rightStart" "$tmpDir/right.$ext"

if [ $noMiddle -eq 0 ]
then
# middle part of audio
ffmpeg -hide_banner -y -i "$inputFile" -af "atrim=start=$middleStart:end=$middleEnd" "$tmpDir/middle.$ext"

# lower middle part 
ffmpeg -hide_banner -y -i "$tmpDir/middle.$ext" -af "volume=$middleVolume" "$tmpDir/middle_l.$ext"
fi

if [ $noMiddle -eq 1 ]
then
# concat two files
ffmpeg -hide_banner -y -i "$tmpDir/left.$ext" -i "$tmpDir/right.$ext" -filter_complex '[0:0][1:0]concat=n=2:v=0:a=1[out]' -map '[out]' "$outputFile"
else
# concat three files
ffmpeg -hide_banner -y -i "$tmpDir/left.$ext" -i "$tmpDir/middle_l.$ext" -i "$tmpDir/right.$ext" -filter_complex '[0:0][1:0][2:0]concat=n=3:v=0:a=1[out]' -map '[out]' "$outputFile"
fi

rm -rf "$tmpDir"

# left part of audio
# ffmpeg -hide_banner -i input.flac -af "atrim=start=0:end=10" left.flac
# right part of audio
# ffmpeg -hide_banner -i input.flac -af "atrim=start=12-0.3" right.flac
# middle part of audio
# ffmpeg -hide_banner -i input.flac -af "atrim=start=10:end=12" middle.flac
# fade out left part, start=length-0.1, end=length+0.3
# ffmpeg -hide_banner -i left.flac -af "afade=t=out:st=9.9:d=0.4" left_f.flac
# fade in right part
# ffmpeg -hide_banner -i right.flac -af "afade=t=in:st=0:d=0.4" right_f.flac
# trim right part
# ffmpeg -hide_banner -i right_f.flac -af "atrim=start=0.1" right_f.flac
# lower middle part 
# ffmpeg -hide_banner -i middle.flac -af "volume=0.75" middle_l.flac
# concat three files
# ffmpeg -hide_banner -i left_f.flac -i middle_l.flac -i right_f.flac -filter_complex '[0:0][1:0][2:0]concat=n=3:v=0:a=1[out]' -map '[out]' fade_percent.flac


