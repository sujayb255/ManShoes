const express=require('express')
const app=express()
const bodyParser=require('body-parser')
const MongoClient= require('mongodb').MongoClient

var db;
var s;

	//connection to database
MongoClient.connect('mongodb://localhost":27017/Inventory', (err,database)=>{
    if (err) return console.log(err)
	db=database.db('Inventory')

	//to make the server listen to db
	app.listen(5000, ()=>{
	    console.log("Connected to port number 5000")
    })
})
	
//to set the view of server is ejs 
app.set('view engine', 'ejs')
	
//data getting is from bodyParser module in terms of json object
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))

app.get('/', (req,res)=>{
  db.collection('ShoeMart').find().toArray((err,result)=>{
    if(err) return console.log(err)
  res.render('homepage.ejs',{data: result}) //result is sent as data to homepage
  // all the records as objects and objects as array is sent to homepage
  })
})

//to load add.ejs file
app.get('/create', (req,res)=>{
    res.render('add.ejs')
})

//to load update.ejs file
/*app.get('/updatestock', (req,res)=>{
  var pid=req.query.pid;
  db.collection('female').find().toArray((err,result)=>{
    if(err) return console.log(err)
    res.render('update.ejs',{data:{pid:pid,female:result}})
  })
})*/
app.get('/edit',(req,res)=>{
	var pid=req.query.pid;
	db.collection('ShoeMart').find().toArray((err,result)=>{
		if(err) return console.log(err);
		res.render('update.ejs',{data:{pid:pid,ShoeMart:result}});
	})
})

app.post('/AddData', (req,res)=>{
    db.collection('ShoeMart').save(req.body,(err,result)=>{
      if(err) return console.log(err)
      res.redirect('/')
    })
})



app.post('/editupdate',(req,res)=>{
	var oldQuantity;
	var DATE=new Date();
	let day = ("0" + DATE.getDate()).slice(-2);
	let month = ("0" + (DATE.getMonth() + 1)).slice(-2);
	let year = DATE.getFullYear();
	var date=day.toString()+"-"+month.toString()+"-"+year.toString();
	var price;
	var quantity;
	var t_price;
	var change;
	var set=0;
	var id={pid:req.body.pid};
	var newValue;
	db.collection('ShoeMart').find().toArray((err,result)=>{
		for(var i=0;i<result.length;i++){
			if(result[i].pid==req.body.pid){
				oldQuantity=result[i].pquantity;
				if(parseInt(req.body.pquantity)+parseInt(oldQuantity)<parseInt(oldQuantity)){
					price=result[i].pselling;
					quantity=parseInt(req.body.pquantity)*-1;
					t_price=(parseInt(req.body.pquantity))*parseInt(req.body.pselling)*-1;
				}
				break;
			}
		}
		if(parseInt(req.body.pquantity)+parseInt(oldQuantity)<0){
			set=1;
			change=(parseInt(req.body.pquantity)+parseInt(oldQuantity))*-1;
			newValue={ $set :{pquantity:0,pselling:req.body.pselling}};
			quantity=quantity-change;
		}
		else{newValue={ $set :{pquantity:parseInt(req.body.pquantity)+parseInt(oldQuantity),pselling:req.body.pselling}};}
		db.collection('ShoeMart').updateOne(id,newValue,(err,result)=>{
			if(err) return console.log(err);
			if(parseInt(req.body.pquantity)+parseInt(oldQuantity)<parseInt(oldQuantity)){
				db.collection('SalesReport').find({pid:req.body.pid}).toArray((err,da)=>{
					var flag=0;
					for(var k=0;k<da.length;k++){
					if(da[k].Purchase_Date==date){
						flag=1;
						console.log("inside");
						var total=(da[k].Total_Sales+t_price);
						var quan=da[k].pquantity+quantity;
						var updatequery={ $set :{pquantity:quan,Total_Sales:total}};
						var _id={_id:da[k]._id};
						db.collection('SalesReport').updateOne(_id,updatequery,(err, bookresult)=>{
							if(err) return console.log("err");
						})
					}}
					if(flag==0){
						console.log("today");
						var q={Purchase_Date:date,pid:req.body.pid,pselling:price,pquantity:(quantity),Total_Sales:t_price}
						db.collection('SalesReport').insertOne(q,(err,resultsale)=>{
							if(err) return console.log(err);
						})
					}
				})
			}
			res.redirect('/');
		})
	})
})


app.post('/delete', (req,res)=>{
    db.collection('ShoeMart').findOneAndDelete({pid: req.body.pid}, (err,result)=>{
      if(err) return console.log(err)
      res.redirect('/')
    })
})

app.get('/sales',(req,res)=>{
	db.collection('SalesReport').find().toArray((err,result)=>{
		if(err) return console.log("err");
		res.render('SalesDetails.ejs',{data:result});
	})
})

app.post('/salesUpdate',(req,res)=>{
	db.collection('SalesReport').find({
		pid: req.body.pid,Purchase_Date: req.body.Purchase_Date
	}).toArray((err,result)=>{
		var q=parseInt(result[0].pquantity)+parseInt(req.body.pquantity)
		var p=parseInt(result[0].Total_Sales)-parseInt(req.body.pquantity)*-1*parseInt(result[0].pselling)
		var query={$set:{pquantity:q,Total_Sales:p}}
		var que={_id:result[0]._id}
		db.collection('SalesReport').updateOne(que,query,(err,result)=>{
			if(err) return console.log("err");
			res.redirect('/sales')
		})
	})

})

app.get('/salesd',(req,res)=>{
	res.render('updatesales.ejs')
})