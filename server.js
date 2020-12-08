require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')



mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const pschema = {
  username:{type: String, required:true},
  log:[
    {
      description:{type:String, required:true},
      duration:{type:Number, required:true},
      date:{type:Date, default: Date.now}
    }
      ]
}
const peopleSchema = new mongoose.Schema(pschema);

const PeopleModel = mongoose.model('body_builders',peopleSchema);

// let people1 = new PeopleModel({username:"riyadh"});
// people1.save((err,data)=>{
//   if(err) console.error(e

// })



app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user',(req,res)=>{
  let username = req.body.username;
  if(username) username =username.trim();
  if(!username){
    res.send('Path `username` is required.');
  }
  else if(username.length > 20){
    res.send('username too long');
  }
  else{
    PeopleModel.findOne({username:username},(err,data)=>{
      if(err) console.error(err);
      if(!data){
        let people1 = new PeopleModel({username:username});
        let id ="";
        people1.save((err,saved)=>{
        if(err) console.error(err)
          res.json({username:username,_id:saved._id});
        })
      }
      else{
        res.send("Username already taken");
      }
    })
  }
 
})

app.post('/api/exercise/add',(req,res)=>{
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  if(!duration){
    res.send('Path `duration` is required.')
  }
  else if(!description){
    res.send('Path `description` is required.');
  }
  else{
     userId = (userId)? userId.trim():userId;
  description = description.trim();
  duration = duration.trim();
  date =(date)?date.trim():'';
    PeopleModel.findById(userId,(err,user)=>{
      if(err){
        res.send(err.message);
        console.log(err.message);
      }
      else{
        if(!user) res.send('Unknown userId');
        else{
        if(date=='' || !date) date = new Date()
        else date = new Date(date);
       user.log.push({description:description, duration:duration, date:date});
       user.save((saveErr, saved)=>{
         if(saveErr) {
           res.send(saveErr.message)
           console.log(saveErr)
         }
         else{
         res.json({_id:userId,username:user.username,date:date.toDateString(),duration:parseInt(duration),description:description})
       }
       })
        }
      }
    })
  }
})


app.get('/api/exercise/log',(req,res)=>{
  let userId = req.query.userId == undefined?'':req.query.userId.trim();
  let fromDate =req.query.from== undefined?'':req.query.from.trim();
  let toDate = req.query.to== undefined?'':req.query.to.trim();
  let limit = req.query.limit== undefined?'':req.query.limit.trim();
  if(!('userId' in req.query)){
    res.send("Unknown userId");
  }
  else{
  PeopleModel.findById(userId,(err,user)=>{
      if(err){
        res.send(err.message);
        console.log(err.message);
      }
      else if(!user){
          res.send("Unknown userId");
      }
      else{
        let userLog = [...user.log];
        // console.log(userLog[0]);
        let result={
          _id:userId,
          username:user.username,
          "from":undefined,
          to:undefined,
          count:0,
          log:[]
        }
        let checkdate = new Date(fromDate);
        let cF = (fromDate=='' || isNaN(checkdate) || !(checkdate instanceof Date));
        checkdate = new Date(toDate);
        let cT = (toDate=='' || isNaN(checkdate) || !(checkdate instanceof Date));
        if(!fromDate && !toDate && userLog.length!=0 &&  userLog !=undefined){
          result.count = 1;
          let log1 = JSON.parse(JSON.stringify(userLog[0]));
          log1.date = new Date(log1.date).toDateString();
          // console.log(log1)
          result.log.push(log1);
          console.log('here1');
        }
        else{
          console.log('here2');
        let temp = new Date(toDate);
        if(!limit || parseInt(limit)) limit = 999999;
        else limit = parseInt(limit);
        let count = 0;
      
        if(cF){
            // console.log('pass');
            fromDate = new Date(0);
        }
        else{
          result['from'] = fromDate;
          fromDate = new Date(fromDate);
        }
      if(cT) {
          toDate = new Date(fromDate);
        }
        else{
          result.to = toDate;
          toDate = new Date(toDate);
        }
        
        for(let i = 0 ; i< user.log.length;i++){
          if(count> limit) break;
          console.log(user.log[i].date);
          // console.log(user.log[i].date)
            let tempD = JSON.parse(JSON.stringify(userLog[i]));
            tempD.date = new Date(tempD.date).toDateString();
            if(user.log[i].date> fromDate && user.log[i].date<toDate ){
              result.log.push(tempD);
              count++;

            }
        }
        result.count =count;
      
        }
      res.json(result);
      }
      
})
  }
})

app.get('/api/exercise/users',(req,res)=>{
  PeopleModel.find({},(err,data)=>{
    if(err) res.send(err.message)
    else{
      let show =[];
      data.forEach((d,i)=>{
        show.push({_id:d._id,username:d.username,_v:d.log.length});
      })
      res.json(show);
    }
  })
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
