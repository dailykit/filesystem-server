const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fileSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		commits: [String],
	},
	{ timestamps: true }
)

module.exports = fileSchema
