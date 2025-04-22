// prisma/seed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  try {
    // Clear existing data
    await prisma.scheduleHistory.deleteMany();
    await prisma.scheduleRecipient.deleteMany();
    await prisma.scheduleParameter.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.parameter.deleteMany();
    await prisma.template.deleteMany();

    console.log("Existing data cleared");

    // 1. Create Brand Video Template
    const brandVideoTemplate = await prisma.template.create({
      data: {
        name: "Brand Video Update",
        description: "Monthly brand video update (sent on the 2nd)",
        content: `📢 Info Penting untuk Affiliate YOUVIT! 🚀
Hi Kakkk {name} 👋,
Ada update nih buat yang masih belum kenal! Yuk, kenalan lebih dalam lagi sama Youvit! 💡✨
📺 Tonton video ini untuk mengetahui informasi penting seputar Youvit 
{video_link}
📖 Untuk detail lebih lengkap, silakan cek product brief di sini:
⭐️ Brief & Product Knowledge ⭐️ 
bit.ly/youvitaffiliateprogram
Jangan sampai ketinggalan! Semakin paham produk, semakin gampang promosiinnya! 💰🔥
Kalau ada pertanyaan, feel free untuk tanya ya! 😉`,
        category: "marketing",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
            {
              id: "video_link",
              name: "Video Link",
              type: "url",
              placeholder: "Enter video URL",
              required: true,
            },
          ],
        },
      },
    });

    console.log("Created Brand Video Template:", brandVideoTemplate.id);

    // 2. Create Welcome New Affiliate Template
    const welcomeTemplate = await prisma.template.create({
      data: {
        name: "Welcome New Affiliate",
        description: "Welcome message for new TikTok affiliates",
        content: `✨Welcome to Youvit Affiliate Club✨
Hai Kak {name}! 👋
Selamat datang di Youvit Affiliate Club! 🥳 Seneng banget Kakak udah join bareng kita. Sekarang saatnya siap-siap cuan bareng Youvit! 🚀
Nah, biar makin siap promosikan produk Youvit, yuk request Free Sample Kakak sekarang!
Klik link ini buat isi formnya:
🎁 Pengajuan Sample 🎁
bit.ly/sampleyouvitindo 
*sample akan diproses maksimal 7 hari
Kalau ada pertanyaan, langsung aja tanyadi grup atau hubungi Vita +62 851-7988-0454
Let's go, waktunya gaspol jualan bareng Youvit! 💪💚
Salam cuan,
Tim Youvit Affiliate`,
        category: "onboarding",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
          ],
        },
      },
    });

    console.log("Created Welcome Template:", welcomeTemplate.id);

    // 3. Create Promotion Tips Template
    const tipsTemplate = await prisma.template.create({
      data: {
        name: "Promotion Tips",
        description: "Weekly promotion tips (sent every Monday)",
        content: `🚀 Tips Penting Saat Promosiin YOUVIT!
Hi Kakk {name} 👋,
Biar promosi kamu makin efektif ada beberapa hal penting yang perlu diperhatikan saat mempromosikan YOUVIT! 📢✨
👉 Cek foto ini yaaa untuk detail lebih jelas!
{tips_image}
Pastikan promosi kamu sesuai dengan panduan ya, biar hasilnya makin maksimal! 🚀🔥 Kalau ada pertanyaan, jangan ragu untuk tanya!
Sukses selalu! 💪💰`,
        category: "education",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
            {
              id: "tips_image",
              name: "Tips Image",
              type: "url",
              placeholder: "Enter image URL",
              required: true,
            },
          ],
        },
      },
    });

    console.log("Created Tips Template:", tipsTemplate.id);

    // 4. Create Top Livestream Performers Template
    const livestreamTemplate = await prisma.template.create({
      data: {
        name: "Top Livestream Performers",
        description: "Weekly top livestream affiliates (sent every Friday)",
        content: `🌟 Top Affiliate Livestream Terbaik Minggu Ini! 🚀
Hi Kakk {name} 👋,
Mau tahu siapa saja affiliate dengan performa dan kualitas livestream terbaik minggu ini? Yuk, belajar dari yang terbaik! 📈✨
Berikut affiliate dengan kinerja & kualitas livestream terbaik minggu ini:
🏆 1. {top_1_name}
🏆 2. {top_2_name}
🏆 3. {top_3_name}
Mereka berhasil menarik banyak penonton dan meningkatkan konversi! 🔥 Yuk, cek akun mereka dan pelajari strategi yang bisa kamu contoh untuk meningkatkan performa livestream-mu! 🚀
Kalau ada pertanyaan atau butuh tips tambahan, feel free untuk tanya ya! 😉
Sukses selalu! 💪💰`,
        category: "recognition",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
            {
              id: "top_1_name",
              name: "Top Performer 1",
              type: "text",
              placeholder: "Enter name of top performer",
              required: true,
            },
            {
              id: "top_2_name",
              name: "Top Performer 2",
              type: "text",
              placeholder: "Enter name of second performer",
              required: true,
            },
            {
              id: "top_3_name",
              name: "Top Performer 3",
              type: "text",
              placeholder: "Enter name of third performer",
              required: true,
            },
          ],
        },
      },
    });

    console.log("Created Livestream Template:", livestreamTemplate.id);

    // 5. Create Top Video Content Template
    const videoContentTemplate = await prisma.template.create({
      data: {
        name: "Top Video Content",
        description: "Weekly top video content (sent every Thursday)",
        content: `🎥 Top 3 Video Terbaik Minggu Ini! 🚀
Hi Kakk {name} 👋,
Mau tahu video promosi YOUVIT yang paling menarik minggu ini? Yuk, lihat dan pelajari strategi mereka biar konten kamu makin maksimal! 🔥
📌 Top 3 Video Terbaik Minggu Ini:
🥇 1. {video_1_link}
🥈 2. {video_2_link}
🥉 3. {video_3_link}
Video-video ini berhasil menarik banyak views dan engagement! Yuk, cek dan ambil inspirasi buat bikin konten yang lebih menarik dan efektif! 🚀✨
Kalau ada pertanyaan atau butuh tips tambahan, jangan ragu untuk tanya ya! 😉
Sukses selalu! 💪💰`,
        category: "recognition",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
            {
              id: "video_1_link",
              name: "Top Video 1",
              type: "url",
              placeholder: "Enter URL of top video",
              required: true,
            },
            {
              id: "video_2_link",
              name: "Top Video 2",
              type: "url",
              placeholder: "Enter URL of second video",
              required: true,
            },
            {
              id: "video_3_link",
              name: "Top Video 3",
              type: "url",
              placeholder: "Enter URL of third video",
              required: true,
            },
          ],
        },
      },
    });

    console.log("Created Video Content Template:", videoContentTemplate.id);

    // 6. Create Product Knowledge Template
    const productKnowledgeTemplate = await prisma.template.create({
      data: {
        name: "Product Knowledge",
        description: "Weekly product knowledge update (sent every Tuesday)",
        content: `📢 Product Knowledge YOUVIT – Cek Foto & Video Ini! 🎥📸
Hi Kakk {name} 👋,
Biar promosi makin maksimal, pastikan kamu paham produk YOUVIT dengan baik! 🚀✨ Kami sudah siapkan foto & video yang bisa kamu pelajari untuk memahami:
✅ Manfaat utama produk
✅ Cara konsumsi yang benar
✅ Keunggulan produk
📸 Cek foto terlampir untuk detail informasi produk!
{info_image}
🎥 Tonton video ini untuk lebih jelasnya: {info_video}
Semakin kamu paham, semakin mudah promosiin dan makin banyak closing! 🔥💰 Kalau ada pertanyaan, jangan ragu untuk tanya ya! 😉
Sukses selalu! 💪`,
        category: "education",
        parameters: {
          create: [
            {
              id: "name",
              name: "Affiliate Name",
              type: "text",
              placeholder: "Enter affiliate name",
              required: true,
            },
            {
              id: "info_image",
              name: "Info Image",
              type: "url",
              placeholder: "Enter image URL",
              required: true,
            },
            {
              id: "info_video",
              name: "Info Video",
              type: "url",
              placeholder: "Enter video URL",
              required: true,
            },
          ],
        },
      },
    });

    console.log(
      "Created Product Knowledge Template:",
      productKnowledgeTemplate.id
    );

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Error in seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
