#!/bin/bash
#

# Make an ffprobe call with specified params.
#
# $1 inputParams: string with command details.


ffprobe $1


# mark this task complete
touch "/data/taskcomplete.marker"
