const Preset = "sndhezym";
const URL = "https://api.cloudinary.com/v1_1/dl4o6ekte";

const File = document.getElementById('file');
File.addEventListener('change',function(event){
    var file = event.target.files[0];
    var formData = new FormData();
    formData.append('file',file);

    axios({
        url : URL,
        method : "POST",
        headers :{
            'Content-Type':'application/x-www-form-urlencoded'
        },
        data : formData
    }).then(function(res){
        console.log(res)
    }).catch(function(err){
        console.log(err)
    })
})