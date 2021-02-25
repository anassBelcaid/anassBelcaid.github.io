#!/bin/bash


blog="/home/anass/github/anass/blog/"

# Building the website
echo "Building the website"
bundle exec  jekyll build


# Copying all the files to the blog
echo "Copying to the blog folder"
cp -Rf  _site/* $blog/




