const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser');
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: String
});
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/api/users', (req, res) => {
  User.find({})
    .then(users => res.json(users))
    .catch(err => res.json(err));
});

app.post('/api/users', (req, res) => {
  const username = { username: req.body.username };
  new User(username).save()
    .then(() => {
      User.findOne(username)
        .then(data => res.json(data))
        .catch(err => res.json(err));
    })
    .catch(err => res.json(err));
});

app.post('/api/users/:_id/exercises', (req, res) => {
  User.findOne({ _id: req.params._id })
    .then(data => {
      const exec = {
        _id: req.params._id,
        username: data.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: new Date(req.body.date).toDateString()
      };
      new Exercise(exec).save()
        .then(() => res.json(exec))
        .catch(err => res.json(err));

    })
    .catch(err => res.json(err));
});

// https://3000-freecodecam-boilerplate-013bsseysmv.ws-us116.gitpod.io/api/users/6714f8b1171db8fbeafe26bd/logs
app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const _id = req.params._id;
  let query = { _id };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from + 'T00:00:00Z'); // Ensure proper date format
    if (to) query.date.$lte = new Date(to + 'T23:59:59Z'); // Ensure proper date format
  }

  User.findOne({ _id })
    .then(user => {
      Exercise.find(query)
        .sort({ date: 1 })
        .limit(parseInt(limit) || 0)
        .then(execsList => res.json({
          _id,
          username: user.username,
          count: execsList.length,
          log: execsList.map(exec => ({
            description: exec.description,
            duration: exec.duration,
            date: exec.date
          }))
        }))
        .catch(err => res.json(err))
    })
    .catch(err => res.json(err));
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
