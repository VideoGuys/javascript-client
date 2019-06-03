# videoguys-javascript-client
Official API

- API version: 0.1
- Package version: 0.1.0

## Requirements.

NodeJS 8.11.4+

### NodeJS

To install this package you must have [NodeJS](https://nodejs.org/en/download/package-manager/) installed, please follow those instructions for your OS before attempting to use this package.

### NPM

Install via [NPM](https://www.npmjs.com/get-npm) (easiest method).

```sh
npm install --save @videoguys/javascript-client
```

Then import the package:
```javascript
const videoguys = require('@videoguys/javascript-client');
```

## Basic Usage

Please follow the installation procedure and then you may run any of the following:

```javascript
const videoguys = require('@videoguys/javascript-client');

const api_client = new videoguys.ApiClient({
  api_host: "[vevio|vidup]",
  api_token: "<api_key>"
});

(async() => {
  try{
    const pair_response = api_client.getVideoPair("<video_code>");
    console.log(pair_response);
    
    const video_info = api_client.getVideoInfo("<video_code>");
    console.log(video_info);
    
    const filepath = "absolute_path_to_file";
    const video_upload = api_client.uploadVideo({
      filepath: filepath, // required filepath for the new video upload
      // size: size, // optional in this function, filepath will auto determine the size
      title: title, // optional title for the new video
      description: description, // optional description for the new video
      folder_id: folder_id, // optional folder_id for the new video
      lite: lite, // optional lite setting for the new video [0 or 1]
      public: public, // optional public setting for the new video [0 or 1]
    });
    console.log(video_upload);

    const video_uploads = api_client.getVideoUploads();
    console.log(video_uploads);

    const video_upload = api_client.updateVideoUpload(
      <upload_code>,
      {
        title: title, // optional new title for the new video
        description: description, // optional new description for the new video
        folder_id: folder_id, // optional new folder_id for the new video
        lite: lite, // optional new lite setting for the new video [0 or 1]
        public: public, // optional new public setting for the new video [0 or 1]
      }
    );
    console.log(video_upload);

    const video_upload = api_client.getVideoUpload("<upload_code>");
    console.log(video_upload);

    const deleted_video_upload = api_client.deleteVideoUpload("<upload_code>");
    console.log(deleted_video_upload);

    const url = "http/https file url";
    const url_upload = api_client.newUrlUpload({
      url: url, // required url for the new url upload
      title: title, // optional title for the new url
      description: description, // optional description for the new url
      folder_id: folder_id, // optional folder_id for the new url
      lite: lite, // optional lite setting for the new url [0 or 1]
      public: public, // optional public setting for the new url [0 or 1]
    });
    console.log(url_upload)
    
    const url_uploads = api_client.getUrlUploads();
    console.log(url_uploads);

    const url_upload = api_client.updateUrlUpload(
      <upload_code>
      {
        title: title, // optional new title for the new url
        description: description, // optional new description for the new url
        folder_id: folder_id, // optional new folder_id for the new url
        lite: lite, // optional new lite setting for the new url [0 or 1]
        public: public, // optional new public setting for the new url [0 or 1]
      }
    );
    console.log(url_upload);

    const url_upload = api_client.getUrlUpload("<upload_code>");
    console.log(url_upload);

    const url_upload_status = api_client.getUrlUploadStatus("<upload_code>");
    console.log(url_upload_status);

    // if the url upload has been downloaded then you should clear it
      // to avoid concurrent hitting limits
    if (
        url_upload_status
        && 'status' in url_upload_status
        && url_upload_status['status'] == "downloaded"
      ){
      const deleted_url_upload = api_client.deleteUrlUpload("<upload_code>");
      console.log(deleted_url_upload);
    }

    const videoDownload = await client.downloadVideo({
      code: "<video_code>",
      filepath: "<destination_filepath>"
    });

    let clientDownloadInterval = setInterval(() => {
      let clientProgress = videoDownload.hasProgress();
      if(clientProgress){
        /*
          the progress object looks like this:
          {
            percent: 0.5,               // Overall percent (between 0 to 1)
            speed: 554732,              // The download speed in bytes/sec
            size: {
                total: 90044871,        // The total payload size in bytes
                transferred: 27610959   // The transferred payload size in bytes
            },
            time: {
                elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                remaining: 81.403       // The remaining seconds to finish (3 decimals)
            }
          }
        */ 
        console.log('download progress', clientProgress);
      }

      let clientError = videoDownload.hasError();
      if(clientError){
        console.error('download error', clientError);
        clearInterval(clientDownloadInterval);
      }

      let clientCompleted = videoDownload.hasCompleted();
      if(clientCompleted){
        console.log('download completed', clientCompleted);
        clearInterval(clientDownloadInterval);
      }

      if(!clientProgress && !clientError && !clientCompleted){
        console.log('download has likely not been started yet');
      }
    }, 2500);

    videoDownload.start();
  }catch(err){
    console.error('err', err);
  }
})();
```

## Documentation For Authorization

 All endpoints except getVideoInfo("<video_code>") and getVideoPair("<video_code>") requires authorization.


## Author

 VideoGuys
