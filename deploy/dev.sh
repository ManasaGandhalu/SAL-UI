#!/bin/sh
api_url="https://api.cf.eu10.hana.ondemand.com"
user="manasa.gandhalu@extentia.com"
password="!)72Msby"
organization="Saudi Airlines Cargo Company_sal-btp-cf-dev-8glkufj3"
space="DEV"
project_path="./"
mtar_file="mta_archives/employee-portal-web_0.0.1.mtar"


#Login to CF space
cf login -a "${api_url}" -u "${user}" -p "${password}" -o "${organization}" -s "${space}"
mbt build -s "${project_path}" 

if [ $? -eq 0 ]; then
    echo "Deploying to ${space}"
    cf deploy "${mtar_file}" -f
    
else
    echo "Error: invalid mtar file"
fi