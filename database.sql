create database startnow;

use startnow;

create table user (
id int auto_increment primary key,
first_name varchar(255),
last_name varchar(255),
password_hash varchar(255),
birthday date,
email varchar(255),
phone varchar(255),
city varchar(255),
state varchar(255),
lvl int,
avatarId int,
short_bio varchar(255),
isMentor int,
created timestamp,
updated timestamp 
);

create table avatar(
id int auto_increment primary key,
name varchar(255),
path varchar(255),
created timestamp,
updated timestamp
);

create table interest(
id int auto_increment primary key,
description varchar(255)
);

create table user_interest(
id int auto_increment primary key,
userId int,
interestId int,
created timestamp,
updated timestamp
);

create table knowledge(
id int auto_increment primary key,
userId int,
marketing int,
finances int,
legislation int,
leadership int,
sales int,
created timestamp,
updated timestamp
);

create table user_points(
id int auto_increment primary key,
userId int,
amount int,
created timestamp,
updated timestamp
);

create table mentoring_relationship(
id int auto_increment primary key,
providerId int,
clientId int,
interestId int,
appointment timestamp,
rating int,
created timestamp,
updated timestamp
);

create table user_trail(
id int auto_increment primary key,
userId int,
dateDone timestamp,
finished int,
rating int
);

create table learning_trail(
id int primary key auto_increment,
name varchar(255),
description varchar(255),
length int,
price int,
rating decimal(10,2)
);

create table points(
id int primary key auto_increment,
description varchar(255),
amount int
);

create table login(
id int auto_increment primary key,
userId int,
logged timestamp
);

create table transactions(
id int auto_increment primary key,
userId int, 
productId int,
shoppingTime timestamp
);

create table market(
id int primary key auto_increment,
item varchar(255),
amount decimal(10,2)
);
