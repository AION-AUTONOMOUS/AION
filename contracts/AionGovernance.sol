// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AION Autonomous Governance, Charity & Finance Splitter
 * @dev هذا العقد يدير توزيع إيرادات وأرباح شركة AION تلقائياً بناءً على النسب الشرعية والاستراتيجية المعتمدة من المالك
 */
contract AionGovernance {
    
    // تثبيت محفظتك الشخصية كمالك ومستلم للأرباح
    address public constant HUMAN_OWNER = 0xCeDA87eaB15e5cdD34597a2678110033F55890f8;
    
    // المحافظ التشغيلية والخيرية (يتم تحديدها عند الإطلاق)
    address public charityWallet;     // محفظة مخصصة لجمع أموال الأعمال الخيرية (15%)
    address public autonomousWallet;  // محفظة تشغيل الأتمتة والخوادم (25%)
    
    // النسب الثابتة برمجياً بناءً على طلبك
    uint256 public constant OWNER_SHARE_PERCENTAGE = 60;
    uint256 public constant CHARITY_SHARE_PERCENTAGE = 15;
    uint256 public constant SYSTEM_SHARE_PERCENTAGE = 25;
    
    // أحداث البلوكشين لمراقبة الشفافية والتدفقات المالية
    event FundsReceived(address indexed sender, uint256 amount);
    event FundsDistributed(uint256 toOwner, uint256 toCharity, uint256 toSystem);

    constructor(address _charityWallet, address _autonomousWallet) {
        require(_charityWallet != address(0), "محفظة الأعمال الخيرية غير صالحة");
        require(_autonomousWallet != address(0), "محفظة النظام غير صالحة");
        charityWallet = _charityWallet;
        autonomousWallet = _autonomousWallet;
    }

    /**
     * @dev استقبال تلقائي لأي أموال أو اشتراكات تدخل للشركة وتوزيعها فوراً
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
        _splitFunds(msg.value);
    }

    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
        _splitFunds(msg.value);
    }

    /**
     * @dev التقسيم البرمجي الفوري للأموال لمنع أي خسائر أو احتجاز مالي
     */
    function _splitFunds(uint256 _amount) private {
        require(_amount > 0, "المبلغ يجب أن يكون أكبر من صفر");

        // حساب الحصص بالمعادلات الرقمية الدقيقة
        uint256 ownerShare = (_amount * OWNER_SHARE_PERCENTAGE) / 100;
        uint256 charityShare = (_amount * CHARITY_SHARE_PERCENTAGE) / 100;
        uint256 systemShare = _amount - (ownerShare + charityShare); // لضمان عدم ضياع أي أجزاء عشرية

        // تحويل المبالغ فوراً إلى مستحقيها إلكترونياً
        payable(HUMAN_OWNER).transfer(ownerShare);
        payable(charityWallet).transfer(charityShare);
        payable(autonomousWallet).transfer(systemShare);

        emit FundsDistributed(ownerShare, charityShare, systemShare);
    }
}
