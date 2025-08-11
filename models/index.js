module.exports = {
  Calls: require('./calls'),
  CallsLogs: require('./calls/logs'),
  Templates: require('./templates'),
  Users: require('./users'),
  Statics: require('./statics'),
  Dispositions: require('./calls/dispositions')
}

// ;(async () => {
//   try {
//     await require('./templates').insertMany([
//       {
//         name: 'B2B Insurance',
//         prompt: 'none',
//         voices: [
//           { value: 'ad8e7602-5433-4cc6-ae05-5ed2bfb5f510', label: 'Raju | English' },
//           { value: 'b494af7f-6c3f-4562-8b55-184dc5b7e164', label: 'Zara | English' },
//           { value: '8d6cb061-be1f-49f1-8a33-4ff45142f113', label: 'Kavya | English' }
//         ]
//       },
//       {
//         name: 'General Outreach',
//         prompt: 'none',
//         voices: [
//           { value: 'c1abd502-9231-4558-a054-10ac950c356d', label: 'Kavya | hindi' }
//         ]
//       }
//     ])

//     console.log('Templates inserted successfully!')
//     process.exit(0)
//   } catch (err) {
//     console.error('Error inserting templates:', err)
//     process.exit(1)
//   }
// })()
