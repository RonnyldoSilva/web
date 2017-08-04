#!/bin/bash
#---------------------------------------------------------------------------#
# Backend requests to Firebase running on local server needs an file to     #
# specify the credentials used to perform the request. The created script   #
# creates a file on local_home, ecis-firebase-identity.json, which provides #
# the necessarily information, and export an environment variable to point  #
# the local file.                                                           #
#---------------------------------------------------------------------------#

JSON='{
\n\t"type": "service_account",
\n\t"project_id": "eciis-splab",
\n\t"private_key_id": "ff323963b37bb4000d2ec92498781ee39eb18132",
\n\t"private_key": "-----BEGIN PRIVATE KEY-----\n\t\tMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtje3MUadO7rQu\n\t\t8iqUFVajKdTIM0ekv+BJiuhPJigcKaqRKmtW5ZpPusu3zykGnCONiS8ehbu0v453\n\t\tSfcvesZ9W4iASvpWZULysUxEJ9WoGeuclsB+QhL3xx0EkWk83ZgxxwsE2JzmfoCV\n\t\tF/hVTBBA7dhJijPxLtBOEDNQt/fBDujaQHbQK2bx7PiPC9xqpu24IZad21q7bpjD\n\t\tNziE4V/OuK+RzF0c3uk8hzsGQd9FY2JDG36jpVM1RdEabGsW7VMH7CAPI/4AoTig\n\t\tyn21SHHI//NnGLbxWgRg7V9qa5zYBGtZP6nfsdqJNUFTzLFYJmN09rcag+D2+9wh\n\t\tJ+pag9RjAgMBAAECggEAFduTUJFovAkAeg3MwqlXUnr7uJpgvQU0sakZbefKfcAv\n\t\tolMQgWQEWw3rB0NuEXjhBLvQyowhjPeNG+/y/jCnxp+cYY/6gZ6vilI9s929IQvh\n\t\tVRoqtHFiOIDZYjsQC8wwFUt8qJ0WpvQqrIcAIySjwrxRv51KF7zYxjlwb7Y5BpVt\n\t\tLlDxpbb1ctgREc4fpu/GjvQos87OMN9zHs4iqBoE6WaZeokLHip7bsHDWni/Df21\n\t\t1Yr7fYGgrR0WdGNEnKP3G317J8Rl3fwx91QyksDq8qzkDCAiC8ICyecLS/SGnT4h\n\t\t+zbCofIUVuamR7aZM7DsZ1Eca3/wsA5bT+c3a+0BhQKBgQDsZHQh2gzPZKsFJsWD\n\t\ttqr8Bg4gCxvhv/RFKWtgMTJGDSr6AwExEc+p9Kd4g4ANXfsw775XFWNi/yL4/8/p\n\t\tC8+mbHB4vumidw3Amf3WmD9eYGI0XgAQGKFVXuUjuasVLH6Qu6XMqKxJUhfCJN8j\n\t\ts6DOfUv6t4SNZfxM1UCAtvQh3wKBgQC78y0RACunq7BcFwXNwqWGDuUJsrme91KQ\n\t\tfMXhfWpjwIuRU7kjADDIW8Ec2P0QjHXPFIK9VO/BjQjR2DxRP3flnwF45+opbK16\n\t\tKSZNVZKRdFBupaIRR+6rpouuw7vv/SIuwED43+1+yDkxjLP9jKK74TioQlY4012h\n\t\tPyPY7gsF/QKBgEirnPPnJ3b+OIDt6VxTZH7zkZYSNDETJJG6aPL6TL0yQRr4n34p\n\t\tPpC90FoA+vWhBZ6GpRn6TkJZsrOfWJgI9H3x6iWEcyhptwWVkW5OAXUO5kG5AAXy\n\t\tvG4VLRXtdwWcVxBBT3f6BnTH0tvxH9PG3dF8vUXG8u3RA13PVPP8ylI7AoGAYeqz\n\t\tvNqo46aHr8JyzJqun2PdIStSlyXkhs/qS6qKJcPnMmQ63Kg5wfhDaGMHnHqA2cym\n\t\tvDqm2eA/CwwriGyXazJmkvXHwaMT0cPkZ3/AZzUAvlReVcBy8ExJE1h37fSjvVV9\n\t\tw+rtkRKA8XaLQvnkwhr46Hf+8YX0jpAVfeuuJIUCgYAHJWFFDrtDDSJJFg/CJumf\n\t\tgQ7PvNeCn6EdqgqD7N7iwuWkfkLszQMmE4bTseOwJVc5p1E88ecoMiVjXhZ1ybYs\n\t\tKzP6roujuRIXb3a4ZSgI3zt/GjQbezOSMJGVGRzhfkAnYc7Cc+m1w1xMEQCOkdjG\n\t\tfZgv/R5crcuPlyMjdPM9Xw==\n\t\t-----END PRIVATE KEY-----\n\t\t",
\n\t"client_email": "eciis-splab@appspot.gserviceaccount.com",
\n\t"client_id": "101421790130872194361",
\n\t"auth_uri": "https://accounts.google.com/o/oauth2/auth",
\n\t"token_uri": "https://accounts.google.com/o/oauth2/token",
\n\t"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
\n\t"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/eciis-splab%40appspot.gserviceaccount.com"
\n}'

FILE_NAME=ecis-firebase-identity.json

echo $JSON >> $HOME"/"$FILE_NAME

echo "\n# The next line export the environment variable to identify Google Requests" >> ~/.bashrc
echo "export GOOGLE_APPLICATION_CREDENTIALS='"$HOME"/"$FILE_NAME"'" >> ~/.bashrc