const fs = require('fs');
const async = require('async');
const request = require('request');

module.exports = class UploadClient {
  constructor({ upload_url, filepath } = {}){
    if(typeof upload_url !== 'undefined'){
      this.upload_url = upload_url;
    }

    if(typeof filepath !== 'undefined'){
      this.filepath = filepath;
    }

    this.progressListeners = [];

    if(this.upload_url) this.setup();
  }

  setup(upload_url = this.upload_url) {
    if(typeof upload_url === 'undefined'){
      throw new Error('upload url required for all requests');
    }

    this.api = request.defaults({
      baseUrl: upload_url,
      headers: {
        'User-Agent': 'VideoGuys/0.1.0/javascript'
      },
      json: true,
      timeout: 120000
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

    this._isSetup = true;
  }

  async complete(){
    this.emitProgress({ status: 'completing' });
    let response = await this.request({
      uri: '/completed',
      method: 'POST'
    });
    this.emitProgressCompleted(response);
    return response;
  }

  setfilepath(filepath){
    this.filepath = filepath;
  }

  setUploadUrl(upload_url){
    this.upload_url = upload_url;
    this.setup();
  }

  async start({ concurrency = 1, retries = 1 }){
    if(!this._isSetup){
      throw new Error('setup upload before starting');
    }

    if(typeof this.filepath === 'undefined'){
      throw new Error('filepath is required to start the upload');
    }
    const chunkpartsize = 1024*1024*10;
    const totalfilesize = fs.statSync(this.filepath).size;
    const totalfileparts = Math.ceil(totalfilesize/chunkpartsize);

    let start = 0;
    let end = totalfilesize > chunkpartsize ? chunkpartsize: totalfilesize;
    let formsToSend = [];
    for(let i = 0; i<totalfileparts; i++){
      const chunk = fs.createReadStream(this.filepath, { start, end: end - 1 });
      const formData = {
        qqfile: chunk,
        qqpartindex: i,
        qqtotalparts: totalfileparts,
        qqtotalfilesize: totalfilesize
      };
      formsToSend.push(formData);
      start = end;
      end = end+chunkpartsize > totalfilesize ? totalfilesize: end + chunkpartsize;
    }

    await async.mapLimit(formsToSend, concurrency, async (formData) => {
      let chunkProgress = {
        status: 'uploading',
        chunk_index: formData.qqpartindex,
        total_indexes: formData.qqtotalparts - 1,
        total_size: formData.qqtotalfilesize
      };
      this.emitProgress(chunkProgress);
      let retriesLeft = retries;
      let uploadResponse;

      let uploaded = false;
      try{
        uploadResponse = await this.request({
          uri: '',
          formData: formData,
          method: 'POST'
        });
        if( !uploadResponse
            || !uploadResponse.success ){
          chunkProgress.status = 'error-during-retry';
          chunkProgress.error = new Error('invalid response from upload server, aborting upload');
          this.emitProgress(chunkProgress);
          throw chunkProgress.error;
        }else{
          uploaded = true;
        }
      }catch(err){
        chunkProgress.status = 'error-retrying';
        chunkProgress.error = err;
        this.emitProgress(chunkProgress);
      }
      while(!uploaded && retriesLeft--){
        try{
          chunkProgress.status = 'retrying-chunk';
          delete chunkProgress.error;
          uploadResponse = await this.request({
            uri: '',
            formData: formData,
            method: 'POST'
          });
          if( !uploadResponse
              || !uploadResponse.success ){
            chunkProgress.status = 'error-during-retry';
            chunkProgress.error = new Error('invalid response from upload server, aborting upload');
            this.emitProgress(chunkProgress);
            throw chunkProgress.error;
          }else{
            uploaded = true;
          }
        }catch(err){
          chunkProgress.status = 'error-retrying';
          chunkProgress.error = err;
          this.emitProgress(chunkProgress);
        }
      }
      chunkProgress.status = 'uploaded';
      delete chunkProgress.error;
      this.emitProgress(chunkProgress);
    });

    return (await this.complete()).video;
  }

  onProgress(callback) {
    this.progressListeners.push(callback);
  }

  emitProgress(progress) {
    this.progressListeners.forEach(callback => callback(progress));
  }

  emitProgressCompleted() {
    while(this.progressListeners.length > 0){
      (this.progressListeners.shift())({ status: 'completed', response });
    }
  }
}