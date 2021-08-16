#!/bin/bash
#

# Convert inputFile into another format with normalization. Use libfdk_aac, 40k 22050hz, normalize (dynamic) to .95 with noise removal

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for result.
# $3 normalization: String for dynaudnorm parameters.
# $4 ba: Audio bitrate.
# $5 ar: Audio sampling frequency.
# $6 noiseRemoval: Whether to run filter for noise removal.

#ffmpeg -hide_banner -y -i "/data/audio/$1" -c:a libfdk_aac -b:a 40k -ar 22050 -filter_complex "compand=attacks=0:points=-80/-900|-45/-15|-27/-9|0/-7|20/-7:gain=5" "/data/audio/$1.tmp.flac"
#ffmpeg -hide_banner -y -i "/data/audio/$1.tmp.flac" -af "dynaudnorm=f=150:c=1:b=1" -c:a libfdk_aac -b:a 40k -ar 22050 "/data/audio/$2"
#rm "/data/audio/$1.tmp.flac"
# mark this task complete
#touch "/data/taskcomplete.marker"

# Convert inputFile into another format with normalization. Use libfdk_aac, 40k 22050hz, normalize (dynamic) to .95 with noise removal

# $1 inputFile: The file name of the source audio, with extension.
# $2 outputFile: The filename for result.
# $3 dynaudnorm: String for dynaudnorm parameters.
# $4 ba: Audio bitrate.
# $5 ar: Audio sampling frequency.
# $6 noiseRemoval: Whether to run filter for noise removal.
# $7 volumeLevels: Volume levels for filter_complex.

filename="$1"
if [[ $7 ]]
then
filename="$1.tmp.wav"
ffmpeg -hide_banner -y -i "/data/audio/$1" -c:a libfdk_aac -b:a 40k -ar 22050 -filter_complex "$7" "/data/audio/$filename"
echo "ffmpeg -hide_banner -y -i /data/audio/$1 -c:a libfdk_aac -b:a 40k -ar 22050 -filter_complex $7 /data/audio/$filename"
fi
if [[ $6 ]]
then
ffmpeg -hide_banner -y -i "/data/audio/$filename" -map a, -af anlmdn, -af "dynaudnorm=$3" -c:a libfdk_aac -b:a $4 -ar $5 "/data/audio/$2"
echo "ffmpeg -hide_banner -y -i /data/audio/$filename -map a, -af anlmdn, -af dynaudnorm=$3 -c:a libfdk_aac -b:a $4 -ar $5 /data/audio/$2"
else
ffmpeg -hide_banner -y -i "/data/audio/$filename" -af "dynaudnorm=$3" -c:a libfdk_aac -b:a $4 -ar $5 "/data/audio/$2"
echo "ffmpeg -hide_banner -y -i /data/audio/$filename -af dynaudnorm=$3 -c:a libfdk_aac -b:a $4 -ar $5 /data/audio/$2"
fi

if [[ $7 ]]
then
rm "/data/audio/$filename"
fi
chmod 777 "/data/audio/$2"

# mark this task complete
touch "/data/taskcomplete.marker"

