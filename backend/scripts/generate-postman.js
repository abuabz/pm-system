const fs = require('fs');
const path = require('path');
const Converter = require('openapi-to-postmanv2');

async function main() {
  try {
    // 1. Fetch Swagger JSON from the running server
    const response = await fetch('http://localhost:3001/api/v1/docs-json');
    const openapiData = await response.json();

    // 2. Convert to Postman
    Converter.convert(
      { type: 'json', data: openapiData },
      {
        folderStrategy: 'Tags',
        includeAuthInfoInExample: true,
      },
      (err, conversionResult) => {
        if (err) {
          console.error('Conversion error:', err);
          process.exit(1);
        }
        if (!conversionResult.result) {
          console.error('Could not convert', conversionResult.reason);
          process.exit(1);
        }

        const postmanCollection = conversionResult.output[0].data;

        // 3. Save to root directory
        const outputPath = path.resolve(__dirname, '../../pm-system.postman_collection.json');
        fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));
        console.log(`Postman collection successfully generated at: ${outputPath}`);
      }
    );
  } catch (err) {
    console.error('Error generating Postman collection:', err);
    console.error('Make sure the backend server is running on http://localhost:3001');
    process.exit(1);
  }
}

main();
