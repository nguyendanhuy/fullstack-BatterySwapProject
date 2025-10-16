-- Query để kiểm tra dữ liệu thực trong database
-- Kiểm tra users có trong database
SELECT userid, email, fullname FROM "users" LIMIT 10;

-- Kiểm tra bookings có trong database và user tương ứng
SELECT
    b.bookingid,
    b.userid,
    u.email,
    u.fullname,
    b.bookingdate,
    b.amount,
    b.bookingstatus,
    b.paymentstatus,
    b.invoiceid
FROM booking b
LEFT JOIN "users" u ON b.userid = u.userid
ORDER BY b.bookingid
LIMIT 20;

-- Kiểm tra booking nào đã thanh toán (PAID) và chưa có invoice
SELECT
    b.bookingid,
    b.userid,
    u.email,
    b.amount,
    b.bookingstatus,
    b.paymentstatus
FROM booking b
LEFT JOIN "users" u ON b.userid = u.userid
WHERE b.paymentstatus = 'PAID'
AND b.invoiceid IS NULL
ORDER BY b.bookingdate DESC
LIMIT 10;
