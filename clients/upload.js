const fs = require('fs');
const request = require('request');

module.exports = class UploadClient {
  constructor({ upload_url, filepath }){
    if(typeof upload_url === 'undefined'){
      throw new Error('upload url required for all requests');
    }
    this.upload_url = upload_url;

    if(typeof filepath !== 'undefined'){
      this.filepath = filepath;
    }

    this.setup();
  }

  setup() {
    this.api = request.defaults({
      baseUrl: this.upload_url,
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
  }

  complete(){
    return this.request({
      uri: '/completed',
      method: 'POST'
    });
  }

  setfilepath(filepath){
    this.filepath = filepath;
  }

  async start(){
    if(typeof this.filepath === 'undefined'){
      throw new Error('filepath is required to start the upload');
    }
    const chunkpartsize = 1024*1024*10;
    const totalfilesize = fs.statSync(this.filepath).size;
    const totalfileparts = Math.ceil(totalfilesize/chunkpartsize);

    let start = 0;
    let end = totalfilesize > chunkpartsize ? chunkpartsize: totalfilesize;
    for(let i = 0; i<totalfileparts; i++){
      const chunk = fs.createReadStream(this.filepath, { start, end: end-1 });
      const formData = {
        qqfile: chunk,
        qqpartindex: i,
        qqtotalparts: totalfileparts,
        qqtotalfilesize: totalfilesize
      };
      const uploadResponse = await this.request({
        uri: '',
        formData: formData,
        method: 'POST'
      });
      if( !uploadResponse
          || !uploadResponse.success ){
        throw new Error('invalid response from upload server, aborting upload');
      }
      i++;
      start=end;
      end+=chunkpartsize;
    }
    return (await this.complete()).video;
  }
}