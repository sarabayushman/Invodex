insert into hsn_gst_rates (hsn_code, description, gst_percent) values
('0101','Live horses and breeding animals',0),('0401','Milk and cream',0),('1006','Rice',0),('1101','Wheat flour',0),('1905','Bread and bakery essentials',5),
('0406','Cheese and curd',5),('0902','Tea',5),('0901','Coffee',5),('3004','Medicaments',12),('3401','Soap and organic surface products',18),
('3926','Plastic office articles',18),('4202','Bags and cases',18),('4412','Plywood and laminated wood',18),('4820','Registers and notebooks',12),('4901','Printed books',0),
('6109','T-shirts and vests',5),('6203','Mens suits and trousers',5),('6403','Footwear with leather uppers',18),('6911','Ceramic tableware',12),('7007','Safety glass',18),
('7214','Iron or steel bars',18),('7308','Steel structures and parts',18),('7323','Kitchen articles of iron or steel',12),('8415','Air conditioning machines',28),('8418','Refrigerators and freezers',18),
('8421','Filtering and purifying machinery',18),('8443','Printers and copying machines',18),('8471','Computers and data processing machines',18),('8473','Computer parts and accessories',18),('8504','Power adapters and UPS equipment',18),
('8517','Telephones and networking equipment',18),('8528','Monitors and projectors',28),('8536','Switches, connectors and relays',18),('8544','Insulated wires and cables',18),('8703','Motor cars',28),
('8708','Motor vehicle parts',28),('9018','Medical instruments',12),('9403','Furniture',18),('9405','Lamps and lighting fittings',12),('9503','Toys and models',12),
('9608','Pens and markers',12),('9983','Professional consulting services',18),('9984','Telecommunication services',18),('9985','Support services',18),('9987','Maintenance and repair services',18),
('9963','Restaurant services',5),('9954','Construction services',18),('9971','Financial and insurance services',18),('9992','Education services',0),('9993','Healthcare services',0),
('8507','Electric accumulators and batteries',28),('8518','Speakers and audio equipment',28),('8523','Storage devices and media',18),('8542','Electronic integrated circuits',18),('9027','Laboratory instruments',18)
on conflict (hsn_code) do update set description = excluded.description, gst_percent = excluded.gst_percent;
