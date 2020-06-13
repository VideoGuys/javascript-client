const fs = require('fs');
const request = require('request');

const UploadClient = require('./upload');
const DownloadClient = require('./download');

module.exports = class ApiClient {
  constructor({ api_token, api_host }){
    if(typeof api_token === 'undefined'){
      throw new Error('missing required api_token');
    }
    this.api_token = api_token;

    if(typeof api_host === 'undefined'){
      throw new Error('missing required api_host');
    }
    this.api_host = 'https://vev.io/api';
    if (api_host == 'vidup'){
      this.api_host = 'https://vidup.io/api';
    }

    this.setup();
  }

  setup() {
    this.api = request.defaults({
      baseUrl: this.api_host,
      qs: {
        api_token: this.api_token
      },
      headers: {
        'User-Agent': 'VideoGuys/0.1.0/javascript'
      },
      json: true,
      timeout: 10000
    });
    const requester = function(options) {
      return new Promise((resolve, reject) => {
        this.api(options, (error, response, body) => {
          if(error){
            reject(error);
          }else{
            resolve(body);
          }
        });
      });
    }
    this.request = requester.bind(this);
  }

  getVideoDownload(code){
    if(typeof code === 'undefined'){
      throw new Error('missing video code');
    }
    const path = `/serve/video/${code}`;
    return this.request({
      uri: path,
      method: 'POST'
    });
  }

  getVideoInfo(code){
    if(typeof code === 'undefined'){
      throw new Error('missing video code');
    }
    const path = `/serve/video/${code}`;
    return this.request({
      uri: path,
      method: 'GET'
    });
  }

  getVideoPair(code){
    if(typeof code === 'undefined'){
      throw new Error('missing video code');
    }
    const path = `/pair/${code}`;
    return this.request({
      uri: path,
      method: 'GET'
    });
  }

  getUrlUploadStatus(code){
    if(typeof code === 'undefined'){
      throw new Error('missing url upload code');
    }
    const path = `/upload/url/${code}/status`;
    return this.request({
      uri: path,
      method: 'GET'
    });
  }

  getVideoUploads(){
    return this.getUploads('video');
  }

  getUrlUploads(){
    return this.getUploads('url');
  }

  getVideoUpload(code){
    return this.getUpload('video', code);
  }

  getUrlUpload(code){
    return this.getUpload('url', code);
  }  

  getUploads(type){
    if(typeof type === 'undefined'){
      throw new Error('missing upload type');
    }
    const path = `/upload/${type}`;
    return this.request({
      uri: path,
      method: 'GET'
    });
  }

  getUpload(type, code){
    if(typeof code === 'undefined'){
      throw new Error(`missing ${type} upload code`);
    }
    const path = `/upload/${type}/${code}`;
    return this.request({
      uri: path,
      method: 'GET'
    });
  }

  newVideoUpload(options){
    let {
      filepath
    } = options;
    if(filepath){
      options.size = fs.statSync(filepath).size;
    }
    return this.newUpload('video', options);
  }

  newUrlUpload(options){
    return this.newUpload('url', options);
  }

  newUpload(type, options){
    const body_params = [
      'url',
      'size',
      'title',
      'description',
      'folder_id',
      'lite',
      'public'
    ];
    const body = {};
    for(let param of body_params){
      if(param in options){
        body[param] = options[param];
      }
    }
    const path = `/upload/${type}`;
    return this.request({
      uri: path,
      method: 'POST',
      body: body
    });
  }

  deleteVideoUpload(code){
    return this.deleteUpload('video', code);
  }

  deleteUrlUpload(code){
    return this.deleteUpload('url', code);
  }

  deleteUpload(type, code){
    if(typeof code === 'undefined'){
      throw new Error(`missing ${type} upload code`);
    }
    const path = `/upload/${type}/${code}`;
    return this.request({
      uri: path,
      method: 'DELETE'
    });
  }

  updateVideoUpload(code, options){
    return this.updateUpload('video', code, options);
  }

  updateUrlUpload(code, options){
    return this.updateUpload('url', code, options);
  }

  updateUpload(type, code, options){
    if(typeof code === 'undefined'){
      throw new Error(`missing required ${type} upload code`);
    }
    const body_params = [
      'title',
      'description',
      'folder_id',
      'lite',
      'public'
    ];
    const body = {};
    for(let param of body_params){
      if(param in options){
        body[param] = options[param];
      }
    }
    const path = `/upload/${type}/${code}`;
    return this.request({
      uri: path,
      method: 'PUT',
      body: body
    });
  }

  async uploadVideo(options){
    let {
      code,
      filepath
    } = options;
    if(typeof filepath === 'undefined'){
      throw new Error('missing required filepath for new video upload');
    }
    let videoUpload;
    if(code){
      videoUpload = await this.getVideoUpload(code);
      if(!Array.isArray(videoUpload.uploads) || !videoUpload.uploads[0]){
        throw new Error(videoUpload.message || 'invalid video code provided');
      }
      videoUpload = videoUpload.uploads[0];
    }else{
      videoUpload = await this.newVideoUpload(options);
      if(typeof videoUpload.upload === 'undefined'){
        throw new Error(videoUpload.message || 'invalid filepath specified');
      }
      videoUpload = videoUpload.upload;
    }

    const uploadClient = new UploadClient({
      filepath,
      upload_url: videoUpload.url
    });

    return uploadClient.start();
  }

  async downloadVideo(options){
    let {
      code,
      filepath
    } = options;
    if(typeof filepath === 'undefined'){
      throw new Error('missing required filepath for new video upload');
    }
    
    const videoStream = await this.getVideoDownload(code);
    if(typeof videoStream.qualities === 'undefined'){
      throw new Error('video qualities could not be determined');
    }
    
    const videoDeleted = videoStream.deleted;
    if(videoDeleted){
      throw new Error('video is deleted');
    }

    const videoQualities = videoStream.qualities;
    if(!Array.isArray(videoQualities) || videoQualities.length <= 0){
      throw new Error('no video qualities available');
    }

    videoQualities.sort((a, b) => {
      return b.size[1] - a.size[1];
    });

    const download_url = videoQualities[0].src;
  
    return new DownloadClient({
      filepath,
      download_url
    });
  }
}