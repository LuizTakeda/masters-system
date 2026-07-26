# masters-system

```mermaid
flowchart TB
    subgraph  Users
        admin(("admin"))
        researcher(("researcher"))
    end

    subgraph Auth
        keyclock["keyclock"]

        admin --> keyclock
        researcher --> keyclock
    end

    subgraph System
        front-end["front-end"]
        back-end["back-end"]
        postgres[(postgres)]

        front-end <--> back-end 
        admin --> front-end
        researcher --> back-end

        back-end --> keyclock
        back-end --> postgres
    end

    subgraph Fiware+
        orion-ld["orion-ld"]
        json-iot-agent["json-iot-agent"]
        mongo-db[("mongo-db")]
        broker-mqtt["broker-mqtt"]

        orion-ld <--> mongo-db
        orion-ld --"schemas"--> back-end
        back-end --"CRUD"--> orion-ld

        json-iot-agent <--> mongo-db
        json-iot-agent --> orion-ld
        json-iot-agent <--> broker-mqtt
        back-end -- "CRUD" --> json-iot-agent

        broker-mqtt -- "device auth"--> back-end
    end

    subgraph Devices
        mqtt-device("mqtt-device")

        mqtt-device --> broker-mqtt
    end
```