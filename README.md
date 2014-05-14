nodejs.poc
==========

This is a small application using node js and jquery. It displays the number of messaeges in a particular queue, which is stored in a csv file.
The node js server loads the csv file, returns its contents as JSON on the call to /status. 
Jquery then displays this Json. 
