/**
 * Simple example Node.js application to demonstrate face detection.
 */

/**
 * Define the dependencies 
 */
var express 	=   require( 'express' )  
	, http 			=		require( 'http' )
	, async 		=		require( 'async' )
	, multer  	= 	require( 'multer' )
	, upload 		=		multer( { dest: 'uploads/' } )	
	, exphbs  	= 	require( 'express-handlebars' )
	, easyimg 	=		require( 'easyimage' )	
	, _ 				=		require( 'lodash' )
	, cv 				= 	require( 'opencv' )
	, gm 				=   require( 'gm' );

/**
 * Create a simple hash of MIME types to file extensions
 */
var exts = {
	'image/jpeg' 	: 	'.jpg',
	'image/png'		: 	'.png',
	'image/gif'		: 	'.gif'
}

/**
 * Note that you may want to change this, depending on your setup.
 */
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
/**
 * Create the express app
 */
var app = express();

/**
 * Set up the public directory
 */
app.use(express.static(__dirname + '/public'))

/**
 * Set up Handlebars templating 
 */
app.engine('.hbs', exphbs( { extname: '.hbs', defaultLayout: 'default' } ) );
app.set( 'view engine', '.hbs' );

/**
 * Default page; simply renders a file upload form 
 */
app.get('/', function( req, res, next ) {

	return res.render('index');

});

/**
 * POST callback for the file upload form. This is where the magic happens. 
 */
app.post('/upload', upload.single('file'), function(req, res, next){
	//Get user choice
	
	var choice = req.body.choice;
	console.log("User chose:");
	console.log(choice);

	// Generate a filename; just use the one generated for us, plus the appropriate extension
	var filename = req.file.filename + exts[req.file.mimetype]
		// and source and destination filepaths
		, src = __dirname + '/' + req.file.path
		, dst = __dirname + '/public/images/' + filename;
	
	var dest_path = __dirname + '/public/images/' + req.file.filename + '_result' + exts[req.file.mimetype];
	var dest_filename =  req.file.filename + '_result' + exts[req.file.mimetype];
	/**
	 * Go through the various steps
	 */
	async.waterfall(
		[
			function( callback ) {
				
				/**
				 * Check the mimetype to ensure the uploaded file is an image
				 */
				if (!_.contains(
					[
						'image/jpeg',
						'image/png',
						'image/gif'
					],
					req.file.mimetype
				) ) {
					
					return callback( new Error( 'Invalid file - please upload an image (.jpg, .png, .gif).' ) )

				}

				return callback();

			},
			function( callback ) {

				/**
			 	* Get some information about the uploaded file	 
			 	*/
				easyimg.info( src ).then(
		
					function(file) {     
					
						/**
						 * Check that the image is suitably large			 
						 */
						if ( ( file.width < 960 ) || ( file.height < 300 ) ) {            
							
							return callback( new Error( 'Image must be at least 640 x 300 pixels' ) );

						}

						return callback();
					}
				);
			},
			function( callback ) {
				
				/**
				 * Resize the image to a sensible size				 
				 */
				easyimg.resize(
		          {
		            width      :   960,            
		            src        :   src, 
		            dst        :   dst            
		          }              
		        ).then(function(image) {
		        	
		        	return callback();

        		});

			},
			function( callback ) {

				/**
         * Use OpenCV to read the (resized) image        	 
         */
        		if(choice=="FaceDetect")
					cv.readImage( dst, callback );

				if(choice=="Gray"){
					console.log(dest_path);
					gm(src).monochrome().write(dest_path , function(err){
						if(!err) console.log('done');
						callback(err,null);
					});
					//callback(null,null);
				}

				if(choice=="Blur"){
					console.log(dest_path);
					gm(src).blur(20).write(dest_path , function(err){
						if(!err) console.log('done');
						callback(err,null);
					});
					//callback(null,null);
				}

				if(choice=="Char"){
					console.log(dest_path);
					gm(src).charcoal(50).write(dest_path , function(err){
						if(!err) console.log('done');
						callback(err,null);
					});
					//callback(null,null);
				}

				if(choice=="Sepia"){
					console.log(dest_path);
					gm(src).sepia().write(dest_path , function(err){
						if(!err) console.log('done');
						callback(err,null);
					});
					//callback(null,null);
				}

				if(choice=="Swirl"){
					console.log(dest_path);
					gm(src).swirl(20).write(dest_path , function(err){
						if(!err) console.log('done');
						callback(err,null);
					});
					//callback(null,null);
				}
			},
			function( im, callback ) {
				console.log('Inside face function');
				/**
				 * Run the face detection algorithm	
				 */
				if(choice=="FaceDetect")
					im.detectObject( cv.FACE_CASCADE, {}, callback );
				/*if(choice=="Gray"){
					console.log("lalala");
					im.convertGrayscale(callback);
					callback(null,null);
				}
				if(choice=="Blur"){
				  console.log("lalala");
				  im.canny(5,300);
					callback(null,null);
				}*/
				else
					callback(null,null);
			}

		],
		function( err, faces ) {
			
			/**
			 * If an error occurred somewhere along the way, render the 
			 * error page.
			 */
			switch(choice){
				case "Gray": console.log("Inside render gray"); break;
				case "Blur": console.log("Inside render blur"); break;
				case "Char": console.log('Inside render charcoal'); break;
				case "Sepia": console.log('Inside render sepia'); break;
				case "Swirl": console.log('Inside render swirl'); break;
			}
		//Processing result for others
		/**************************/
			if(choice!="FaceDetect"){
			console.log(dest_filename);
				return res.render(
					'result_gray',
					{
						filename : dest_filename
					}
				);
			}
		/***************************/
			if(choice=="FaceDetect"){
				console.log('Inside render Faces'); 
				if ( err ) {
					
					return res.render(
						'error',
						{
							message : err.message
						}
					);
				}
				console.log("No errors found!");
			/**
			 * We're all good; render the result page.
			 */
				return res.render(
		    	'result',
		    	{
		    		filename 	: 	filename,
		    		faces 		: 	faces
		    	}
		    );
			}
			
		}			
	);

});

/**
 * Start the server 
 */
http.createServer(  
	app
).listen( port, ip , function( server ) {
	console.log( 'Listening on port %d with ip %s', port ,ip );
});
