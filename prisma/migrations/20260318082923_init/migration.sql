-- CreateEnum
CREATE TYPE "OltType" AS ENUM ('ZTE', 'HIOSO');

-- CreateEnum
CREATE TYPE "OnuStatus" AS ENUM ('ONLINE', 'LOS', 'OFFLINE');

-- CreateTable
CREATE TABLE "Olt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "snmp_community" TEXT NOT NULL,
    "snmp_version" TEXT NOT NULL DEFAULT 'v2c',
    "telnet_user" TEXT,
    "telnet_pass" TEXT,
    "type" "OltType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Olt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Router" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "api_port" INTEGER NOT NULL DEFAULT 8728,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Router_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Odc" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_long" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Odc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Odp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "odc_id" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_long" DOUBLE PRECISION NOT NULL,
    "total_ports" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Odp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "billing_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pppoe_username" TEXT NOT NULL,
    "router_id" TEXT,
    "olt_id" TEXT NOT NULL,
    "odp_id" TEXT NOT NULL,
    "odp_port" INTEGER NOT NULL,
    "sn_mac" TEXT NOT NULL,
    "rx_installation" DOUBLE PRECISION,
    "location_lat" DOUBLE PRECISION NOT NULL,
    "location_long" DOUBLE PRECISION NOT NULL,
    "modem_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnuMetrics" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "rx_live" DOUBLE PRECISION,
    "tx_live" DOUBLE PRECISION,
    "status" "OnuStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnuMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_billing_id_key" ON "Customer"("billing_id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_pppoe_username_key" ON "Customer"("pppoe_username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_sn_mac_key" ON "Customer"("sn_mac");

-- AddForeignKey
ALTER TABLE "Odp" ADD CONSTRAINT "Odp_odc_id_fkey" FOREIGN KEY ("odc_id") REFERENCES "Odc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_router_id_fkey" FOREIGN KEY ("router_id") REFERENCES "Router"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_olt_id_fkey" FOREIGN KEY ("olt_id") REFERENCES "Olt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_odp_id_fkey" FOREIGN KEY ("odp_id") REFERENCES "Odp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnuMetrics" ADD CONSTRAINT "OnuMetrics_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
