import { useEffect, useState } from "react";
import Slider from "react-slick";
import TopWidget from "../widgets/TopWidget";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Dashboard() {
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    setWidgets([
      { widget_id: 1, title: "Open Sales Order" },
      { widget_id: 2, title: "Ready To Ship" },
      { widget_id: 3, title: "Invoice MTD" },
      { widget_id: 4, title: "Pending Invoices" },
      { widget_id: 5, title: "Completed Projects" },
      { widget_id: 6, title: "Active Users" },
    ]);
  }, []);

  const settings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true, // show next/prev arrows
    autoplay: false, // no auto sliding
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <Slider {...settings}>
      {widgets.map((widget) => (
        <div key={widget.widget_id} style={{ padding: "10px" }}>
          <TopWidget widget={widget} />
        </div>
      ))}
    </Slider>
  );
}
