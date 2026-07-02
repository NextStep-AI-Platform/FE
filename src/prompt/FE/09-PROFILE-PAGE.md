# NextStep AI — Profile Page (MVP Update)
# Prompt #09: ProfilePage.tsx

## Prompt to Claude Code

```
Read FE/00-DESIGN-SYSTEM.md first.
Requires AppContext + ToastContext.

Update src/pages/ProfilePage.tsx:

---

### Tabs
- info → "Thông tin"
- cv-history → "Lịch sử CV"  (RENAMED purpose — files only)
- settings → "Cài đặt"

Support URL query ?tab=settings from sidebar link.

---

### Header Card
- Avatar: clickable upload (input type=file accept="image/*")
  - On select: FileReader → store base64 in user.avatarUrl (localStorage)
  - Fallback: gradient circle with getInitials(name)
- Plan badge from context: Free / Premium / VIP
- If upgraded: show "Gói {type} · Hết hạn {date}" or "Còn {n} buổi phỏng vấn"
- Stats row: total scans, best score, scans remaining this month

---

### Tab: Thông tin
Editable: name, phone, role, industry (keep existing pattern)
Save → toast.success("Đã lưu thay đổi")
Email: read-only

---

### Tab: Lịch sử CV

**IMPORTANT CHANGE:**
- List ONLY uploaded CV files from AppContext.cvFiles
- Do NOT show scan results here
- Do NOT show text-pasted CVs
- **Remove** "+ Scan mới" button

Each item:
- FileText icon
- fileName, fileSize (KB/MB), uploadedAt
- Optional: "Dùng lại" button → navigate /cv-scan with file preselected (via state)

Empty state: "Chưa có CV nào được tải lên"

---

### Tab: Cài đặt

**Gói dịch vụ** — show current plan + upgrade button

**Thông báo** — toggles:
- Nhắc nhở scan CV hàng tháng
- Cập nhật tính năng mới
- Tin tức nghề nghiệp

On toggle:
```ts
toggleNotificationSetting(key, enabled)
toast.info(enabled ? `Đã bật ${label}` : `Đã tắt ${label}`)
```

**Xóa tài khoản**
Button → Confirm dialog:
"Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác."
Actions: Hủy | Xóa (danger)

On confirm:
- deleteAccount()
- toast.success("Đã xóa tài khoản thành công")
- navigate('/')

**Đăng xuất** button → logout + toast + navigate /

---

### Technical
- useSearchParams for tab query
- useApp(), useToast()
```
