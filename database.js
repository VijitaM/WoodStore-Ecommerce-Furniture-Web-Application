import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password:process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

console.log("PRODUCT DETAILS")
async function getProduct(){
    const [result] = await pool.query("SELECT * FROM products")
    return result
}
const pdt=await getProduct()
console.log(pdt)

console.log("USER DETIALS")
async function getUser(){
    const [result] = await pool.query("SELECT * FROM userdetails")
    return result
}
const user=await getUser()
console.log(user)

console.log("CATEGORIES")
async function getCate(){
    const [result] = await pool.query("SELECT * FROM categories")
    return result
}
const ct=await getCate()
console.log(ct)

console.log("CART DETAILS")
async function getCartdet(){
    const [result] = await pool.query("SELECT * FROM cart")
    return result
}
const cdet=await getCartdet()
console.log(cdet)

/*async function getNote(id){
    const [rows]= await pool.query("SELECT * FROM products WHERE id=?", [id])
        return rows[0]
}
const note=await getNote(10)
console.log(note)*/


