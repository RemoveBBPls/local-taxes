import fs from 'fs';
import path from 'path';
import util from 'util';

export const prettyLog = (obj: any) => {
	console.log(
		util.inspect(obj, {
			depth: null, // show everything (no [Array])
			colors: true, // color output in terminal
			maxArrayLength: null, // show full arrays
			compact: false, // pretty multiline formatting
		})
	);
};

/**
 * Writes any JS object as pretty JSON to a file.
 * Creates the file if missing, overwrites if exists.
 *
 * @param {string} filePath - Path to output JSON file
 * @param {any} data - Any JS object or array
 */
export const saveJson = (filePath, data) => {
	try {
		const dir = path.dirname(filePath);

		// Create directory if it doesn't exist
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Convert object → pretty JSON
		const json = JSON.stringify(data, null, 2);

		// Write (overwrite) file
		fs.writeFileSync(filePath, json, 'utf8');

		console.log(`✔ JSON saved to ${filePath}`);
	} catch (err) {
		console.error('❌ Error saving JSON:', err);
	}
};
