import { useEffect, useState } from "react";
function BusList(){
    const [buses, setBuses] =useState([]);

    useEffect(() =>{
        fetch("http://localhost:5000/api/buses")
            .then(res => res.json())
            .then(data =>setBuses(data));
    }, []);
    return (
        <div>
            <h2> Bus list</h2>
            <ul>
                {buses.map(bus => (
                    <li key={bus.id}>
                        {bus.licensePlate} - Suc chua: {bus.capacity}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BusList;