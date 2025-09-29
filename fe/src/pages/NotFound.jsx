import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import React from 'react';
import { Button, Result } from 'antd';
const NotFound = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
    extra={<Button type="primary"><Link to={"/"}>Back Home</Link>Back Home</Button>}
  />
);
export default NotFound;
