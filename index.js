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

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  User.find({})
    .then(users => res.json(users))
    .catch(err => res.json(err));
});

app.post('/api/users', (req, res) => {
  const user = { username: req.body.username };
  new User(user).save()
    .then(() =>
      User.findOne(user)
        .then(data => res.json(data))
        .catch(err => res.json(err))
    )
    .catch(err => res.json(err));
});

app.post('/api/users/:userId/exercises', (req, res) => {
  User.findById(req.params.userId)
    .then(user => {
      const exec = {
        username: user.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: req.body.date ? new Date(req.body.date) : new Date()
      };
      new Exercise(exec).save()
        .then(() => {
          exec.date = exec.date.toDateString();
          exec._id = req.params.userId;
          res.json(exec);
        })
        .catch(err => res.json(err));
    })
    .catch(err => res.json(err));
});

app.get('/api/users/:userId/logs', (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params.userId;

  User.findById(userId)
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' });

      Exercise.find({ username: user.username })
        .then(execList => {
          // sort and arrange elements
          let log = execList
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(e => ({
              description: e.description,
              duration: e.duration,
              date: new Date(e.date).toDateString()
            }));

          // find range
          if (from) log = log.filter(e => new Date(e.date) > new Date(from));
          if (to) log = log.filter(e => new Date(e.date) < new Date(to));

          // limit results if needed
          if (limit) {
            if (log.length > parseInt(limit))
              log = log.slice(0, parseInt(limit));
          }

          res.json({
            username: user.username,
            count: log.length,
            _id: userId,
            log
          });
        })
        .catch(err => res.status(500).json({ err, msg: 'Error retrieving logs' }));
    })
    .catch(err => res.status(500).json({ err, msg: 'Error finding user' }));
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
