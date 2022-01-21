#!/bin/bash

TAG=$(git tag -l "v*" --sort=-creatordate | head -n1 | cut -c2-)
FOUND_CHANGES=false
cat CHANGELOG.md | while read line; do
    # Detect end of new changes
    if [[ "$line" == "## "* ]] && [[ "$FOUND_CHANGES" == true ]]; then
        exit 0
    fi

    # Print new changes 
    if [[ $FOUND_CHANGES == true ]]; then
        echo "$line"
    fi

    # Detect start of new changes
    if [[ "$line" == "## $TAG"* ]]; then
        FOUND_CHANGES=true
    fi
done
