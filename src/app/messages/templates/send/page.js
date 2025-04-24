"use client";

import React from "react";
import PageLayout from "@/components/templates/PageLayout";
import TemplateMessageSender from "@/components/organisms/TemplateMessageSender";
import Card from "@/components/atoms/Card";
import {
  MessageSquare,
  Database,
  Info,
  Users,
  CheckSquare,
  Send,
} from "lucide-react";

export default function TemplateSenderPage() {
  return (
    <PageLayout
      title="Kirim Pesan Template"
      description="Kirim pesan WhatsApp menggunakan template yang tersimpan di database"
    >
      {/* Main sender component */}
      <TemplateMessageSender />

      {/* Info section */}
      <div className="mt-8">
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              Tentang Fitur Pengiriman Pesan Template
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-gray-700 space-y-3">
              <p>
                Fitur ini memungkinkan Anda mengirim pesan WhatsApp menggunakan
                template yang tersimpan di database. Template pesan membantu
                Anda:
              </p>

              <ul className="list-disc pl-5 space-y-1">
                <li>Mengirim pesan yang konsisten ke banyak penerima</li>
                <li>Mempersonalisasi pesan dengan mengisi parameter</li>
                <li>
                  Menghemat waktu dengan tidak perlu mengetik pesan berulang
                  kali
                </li>
                <li>Memastikan semua informasi penting termasuk dalam pesan</li>
              </ul>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="bg-indigo-50 p-4 rounded-md">
                  <div className="flex items-center text-indigo-700 font-medium mb-2">
                    <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                    <h3>1. Pilih Template</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pilih sesi WhatsApp dan template pesan yang ingin digunakan
                    dari daftar yang tersedia.
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-md">
                  <div className="flex items-center text-indigo-700 font-medium mb-2">
                    <CheckSquare className="h-5 w-5 mr-2 text-indigo-600" />
                    <h3>2. Isi Parameter</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Isi semua parameter yang dibutuhkan oleh template. Parameter
                    akan otomatis terisi untuk kontak yang dipilih.
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-md">
                  <div className="flex items-center text-indigo-700 font-medium mb-2">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    <h3>3. Pilih Penerima</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pilih penerima dari daftar kontak yang ada atau masukkan
                    nomor telepon secara manual.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
                <h4 className="font-medium flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Catatan Penting:
                </h4>
                <ul className="mt-2 text-sm space-y-1 list-disc pl-5">
                  <li>
                    Pastikan sesi WhatsApp terkoneksi sebelum mengirim pesan
                  </li>
                  <li>
                    Format nomor telepon akan dikonversi otomatis ke format
                    62xxx (Contoh: 08123456789 → 6281234567890)
                  </li>
                  <li>
                    Pengiriman pesan menggunakan jeda 2-3 detik antar pesan
                    untuk menghindari pemblokiran oleh WhatsApp
                  </li>
                  <li>
                    Parameter {"{name}"} akan otomatis terisi dengan nama kontak
                    jika hanya satu kontak yang dipilih
                  </li>
                  <li>
                    Semua pesan yang dikirim menggunakan template akan tercatat
                    dalam history
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-md mt-4">
                <div className="flex items-center text-green-700 font-medium mb-2">
                  <Send className="h-5 w-5 mr-2" />
                  <h3>Keunggulan Menggunakan Template</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Dengan menggunakan template, Anda dapat mengirim pesan secara
                  konsisten dan profesional ke banyak penerima sekaligus.
                  Template dapat disesuaikan dengan kebutuhan, seperti promosi
                  produk, pengumuman penting, ucapan selamat, dan lainnya.
                  Parameter memungkinkan personalisasi yang membantu
                  meningkatkan engagement dari penerima pesan.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </PageLayout>
  );
}
